import { HttpClient } from '@angular/common/http';
import { ErrorHandler, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { ConnectivityService } from '../playback/connectivity';
import { PlayerStore } from '../playback/player-store';

/** One page-wide banner (L2-042): tone, bold title and text; danger is announced as an alert. */
export interface Banner {
  id: 'maintenance' | 'offline' | 'online' | 'streaming';
  tone: 'info' | 'success' | 'warning' | 'danger';
  title: string;
  text: string;
}

/**
 * The page-wide banners above the header (L2-042): scheduled maintenance from GET /api/status, offline and
 * back online from the browser's connectivity, and "Playback can’t start" when the stream stalls while online.
 * Each can be dismissed; a change of state shows it again (ADR 0019).
 */
@Injectable({ providedIn: 'root' })
export class BannerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly connectivity = inject(ConnectivityService);
  private readonly player = inject(PlayerStore);
  private readonly maintenance = signal<string | null>(null);
  private readonly backOnline = signal(false);
  private readonly dismissed = signal<ReadonlySet<Banner['id']>>(new Set());
  /** Pages that show their own offline message, such as Home (L2-002 AC3), hide the offline banner. */
  readonly ownOfflineMessage = signal(false);

  readonly banners = computed<Banner[]>(() => {
    const list: Banner[] = [];
    const window = this.maintenance();
    if (window) {
      list.push({
        id: 'maintenance',
        tone: 'info',
        title: 'Scheduled maintenance',
        text: `Hummi will be read-only on ${window}. Playback keeps working.`,
      });
    }
    if (!this.connectivity.online()) {
      if (!this.ownOfflineMessage()) {
        list.push({
          id: 'offline',
          tone: 'warning',
          title: 'You’re offline',
          text: 'Showing saved tracks. Reconnect to stream anything new.',
        });
      }
    } else if (this.backOnline()) {
      list.push({
        id: 'online',
        tone: 'success',
        title: 'You’re back online',
        text: 'Your queue and likes are up to date.',
      });
    }
    if (this.connectivity.online() && this.player.stalled()) {
      list.push({
        id: 'streaming',
        tone: 'danger',
        title: 'Playback can’t start',
        text: 'We can’t reach the streaming service right now. We’re on it.',
      });
    }
    return list.filter((b) => !this.dismissed().has(b.id));
  });

  constructor() {
    let wasOnline = this.connectivity.online();
    effect(() => {
      const online = this.connectivity.online();
      untracked(() => {
        if (online && !wasOnline) this.backOnline.set(true);
        if (!online) this.backOnline.set(false);
        this.undismiss(online ? 'online' : 'offline');
        wasOnline = online;
      });
    });
    effect(() => {
      if (this.player.stalled()) untracked(() => this.undismiss('streaming'));
    });
  }

  /** Reads the maintenance window once at start; a failure shows no banner. */
  async load(): Promise<void> {
    try {
      const status = await firstValueFrom(this.http.get<{ maintenance: string | null }>(`${this.baseUrl}/status`));
      this.maintenance.set(status.maintenance);
    } catch {
      this.maintenance.set(null);
    }
  }

  dismiss(id: Banner['id']): void {
    this.dismissed.update((set) => new Set([...set, id]));
    if (id === 'online') this.backOnline.set(false);
  }

  private undismiss(id: Banner['id']): void {
    this.dismissed.update((set) => new Set([...set].filter((x) => x !== id)));
  }
}

/**
 * When a page cannot render (L2-046): the error is recorded with POST /api/client-errors so the team is told,
 * and the Server error page replaces the page without changing the address, so Try again reloads it.
 */
@Injectable()
export class ServerErrorHandler implements ErrorHandler {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly router = inject(Router);
  private showing = false;

  handleError(error: unknown): void {
    console.error(error);
    if (this.showing) return;
    this.showing = true;
    const message = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
    const path = location.pathname + location.search;
    this.http.post(`${this.baseUrl}/client-errors`, { message, path }).subscribe({ error: () => undefined });
    void this.router.navigateByUrl('/server-error', { skipLocationChange: true }).finally(() => (this.showing = false));
  }
}

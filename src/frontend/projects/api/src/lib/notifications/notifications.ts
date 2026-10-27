import { HttpClient } from '@angular/common/http';
import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Observable, filter, firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';
import { SessionStore } from '../auth/session-store';

export type NotificationKind = 'release' | 'share' | 'milestone' | 'product';

/** One notification; the page words it by kind (L2-036 AC2). */
export interface NotificationDto {
  id: string;
  kind: NotificationKind;
  actorName: string | null;
  actorLink: string | null;
  itemName: string | null;
  itemLink: string | null;
  plays: number | null;
  text: string | null;
  createdAt: string;
  unread: boolean;
}

/** GET /api/me/notifications: newest first, with the unread count. */
export interface NotificationsDto {
  unread: number;
  items: NotificationDto[];
}

/** The signed-in listener's notifications (L2-036, L2-037). */
@Injectable({ providedIn: 'root' })
export class NotificationsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  list(): Observable<NotificationsDto> {
    return this.http.get<NotificationsDto>(`${this.baseUrl}/me/notifications`);
  }

  unreadCount(): Observable<{ unread: number }> {
    return this.http.get<{ unread: number }>(`${this.baseUrl}/me/notifications/unread-count`);
  }

  markAllRead(): Promise<ApiResult<unknown>> {
    return toResult(this.http.post(`${this.baseUrl}/me/notifications/read-all`, null));
  }
}

/**
 * The header bell's unread count (L2-037 AC1): read when a listener signs in and after every navigation,
 * so it catches up without polling (ADR 0017). Zero for a visitor.
 */
@Injectable({ providedIn: 'root' })
export class UnreadStore {
  private readonly api = inject(NotificationsApi);
  private readonly session = inject(SessionStore);
  private readonly count = signal(0);
  readonly unread = this.count.asReadonly();

  constructor() {
    effect(() => {
      if (this.session.signedIn()) untracked(() => void this.refresh());
      else this.count.set(0);
    });
    const subscription = inject(Router)
      .events.pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.session.signedIn()) void this.refresh();
      });
    inject(DestroyRef).onDestroy(() => subscription.unsubscribe());
  }

  async refresh(): Promise<void> {
    try {
      this.count.set((await firstValueFrom(this.api.unreadCount())).unread);
    } catch {
      // Keep the last count; the bell is a hint, not a source of truth.
    }
  }

  /** The page read the list or marked it all read: the bell follows at once. */
  set(unread: number): void {
    this.count.set(unread);
  }
}

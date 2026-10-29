import { HttpClient } from '@angular/common/http';
import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';
import { SessionStore } from '../auth/session-store';
import { PlayerStore } from '../playback/player-store';

export type Theme = 'device' | 'light' | 'dark';

/** GET and PUT /api/me/settings (L2-033 to L2-035, L2-049). */
export interface SettingsDto {
  displayName: string;
  email: string;
  emailConfirmed: boolean;
  autoplaySimilar: boolean;
  crossfade: boolean;
  theme: Theme;
  notifyNewReleases: boolean;
  productNews: boolean;
}

const THEME_KEY = 'hummi.theme';

/** Dark is applied whatever the saved choice, for now (ADR 0025). Set to false to restore Light and Match my device. */
const ALWAYS_DARK = true;

/**
 * The listener's settings, read from the server when they sign in so every device agrees (L2-033 AC4),
 * and applied: the theme on the document's data-theme (none for "Match my device", L2-049) and the
 * Playback switches on PlayerStore (L2-034). A visitor's theme lives in localStorage (ADR 0016).
 */
@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly session = inject(SessionStore);
  private readonly player = inject(PlayerStore);
  private readonly document = inject(DOCUMENT);
  private readonly current = signal<SettingsDto | null>(null);
  readonly settings = this.current.asReadonly();

  constructor() {
    this.applyTheme(readTheme());
    effect(() => {
      if (this.session.signedIn()) untracked(() => void this.load());
      else untracked(() => this.player.setPreferences({ autoplaySimilar: true, crossfade: false }));
    });
  }

  async load(): Promise<SettingsDto | null> {
    try {
      const settings = await firstValueFrom(this.http.get<SettingsDto>(`${this.baseUrl}/me/settings`));
      this.apply(settings);
      return settings;
    } catch {
      return null;
    }
  }

  async save(settings: Omit<SettingsDto, 'emailConfirmed'>): Promise<ApiResult<SettingsDto>> {
    const result = await toResult(this.http.put<SettingsDto>(`${this.baseUrl}/me/settings`, settings));
    if (result.ok) {
      this.apply(result.value);
      // The name in the header and the confirmation banner follow the saved account.
      void this.session.reload();
    }
    return result;
  }

  /** Applies a theme at once, as a visitor's choice or before saving. */
  applyTheme(theme: Theme): void {
    const root = this.document.documentElement;
    if (ALWAYS_DARK) root.setAttribute('data-theme', 'dark');
    else if (theme === 'device') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Blocked storage: the theme still applies for this visit.
    }
  }

  private apply(settings: SettingsDto): void {
    this.current.set(settings);
    this.applyTheme(settings.theme);
    this.player.setPreferences({ autoplaySimilar: settings.autoplaySimilar, crossfade: settings.crossfade });
  }
}

function readTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'device';
  } catch {
    return 'device';
  }
}

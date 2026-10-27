import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';

import { API_BASE_URL } from '../api-base-url';
import { ApiResult, toResult } from '../api-result';

/** The signed-in user as GET /api/auth/me returns it. */
export interface CurrentUser {
  displayName: string;
  email: string;
  /** False until the listener opens their confirmation link (L2-028 AC4). */
  emailConfirmed: boolean;
}

/**
 * Session state of the app. The session lives in HttpOnly cookies, so the app only
 * knows who is signed in by asking the Hummi API; nothing is kept in web storage.
 */
@Injectable({ providedIn: 'root' })
export class SessionStore {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly current = signal<CurrentUser | null>(null);
  private readonly loaded = signal(false);
  private loading: Promise<void> | null = null;

  /** The signed-in user, or null for a visitor. */
  readonly user = this.current.asReadonly();
  /** True when a listener is signed in; false for a visitor. */
  readonly signedIn = computed(() => this.current() !== null);
  /** True once the first GET /api/auth/me has answered. */
  readonly ready = this.loaded.asReadonly();

  /** Loads the user once; later calls reuse the first answer. */
  load(): Promise<void> {
    this.loading ??= toResult(this.http.get<CurrentUser>(`${this.baseUrl}/auth/me`)).then((result) => {
      this.current.set(result.ok ? result.value : null);
      this.loaded.set(true);
    });
    return this.loading;
  }

  /** Asks the Hummi API again, for example after the account changed. */
  reload(): Promise<void> {
    this.loading = null;
    return this.load();
  }

  /** Starts a session (L2-029); with keepSignedIn the session outlives the browser. */
  async signIn(email: string, password: string, keepSignedIn: boolean): Promise<ApiResult<CurrentUser>> {
    const result = await toResult(
      this.http.post<CurrentUser>(`${this.baseUrl}/auth/sign-in`, { email, password, keepSignedIn }),
    );
    if (result.ok) {
      this.current.set(result.value);
      this.loaded.set(true);
      this.loading = Promise.resolve();
    }
    return result;
  }

  /** Ends the session on this device (L2-031); on failure the listener stays signed in. */
  async signOut(): Promise<ApiResult<unknown>> {
    const result = await toResult(this.http.post(`${this.baseUrl}/auth/sign-out`, null));
    if (result.ok) this.current.set(null);
    return result;
  }

  /** Called by the interceptor when the session could not be renewed. */
  clear(): void {
    this.current.set(null);
  }
}

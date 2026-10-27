import { Injectable, inject, signal } from '@angular/core';

import { SessionStore } from './session-store';

/**
 * The one client-side check every save action calls (L2-032): like, add to a playlist, follow, create a
 * playlist. Signed out, it opens the "Sign in to save this" prompt, which the shell renders, and answers
 * false before any request is made, so nothing is saved. The API rejects unauthenticated saves on its own.
 */
@Injectable({ providedIn: 'root' })
export class SignInGate {
  private readonly session = inject(SessionStore);
  private readonly open = signal(false);
  /** True while the prompt is shown. */
  readonly promptOpen = this.open.asReadonly();

  /** True when the listener may save; otherwise opens the prompt. */
  allow(): boolean {
    if (this.session.signedIn()) return true;
    this.open.set(true);
    return false;
  }

  closePrompt(): void {
    this.open.set(false);
  }
}

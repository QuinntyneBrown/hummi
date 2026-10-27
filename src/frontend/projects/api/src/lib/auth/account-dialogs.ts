import { Injectable, signal } from '@angular/core';

/** The shell's Sign out of Hummi? dialog (L2-031), opened from the account menu or Settings. */
@Injectable({ providedIn: 'root' })
export class AccountDialogs {
  private readonly signOutState = signal(false);
  readonly signOutOpen = this.signOutState.asReadonly();

  openSignOut(): void {
    this.signOutState.set(true);
  }

  closeSignOut(): void {
    this.signOutState.set(false);
  }
}

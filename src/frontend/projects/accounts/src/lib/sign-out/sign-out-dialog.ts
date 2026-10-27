import { ChangeDetectionStrategy, Component, inject, output, signal } from '@angular/core';
import { SessionStore } from '@hummi/api';
import { AlertComponent, ButtonDirective, DialogComponent, IconComponent } from '@hummi/components';

/**
 * "Sign out of Hummi?" (L2-031), opened from the account menu: Cancel and Sign out. While signing out
 * Cancel is disabled and the button reads "Signing out…"; a failure shows "That didn’t work" and keeps
 * the session. Success clears SessionStore, so the shell switches to its signed-out layout.
 */
@Component({
  selector: 'hm-sign-out-dialog',
  imports: [AlertComponent, ButtonDirective, DialogComponent, IconComponent],
  template: `
    <hm-dialog
      heading="Sign out of Hummi?"
      description="Your playlists and likes stay saved. You can keep listening without an account."
      icon="logout"
      (dismiss)="cancel()"
    >
      @if (failed()) {
        <hm-alert tone="danger" heading="That didn’t work">
          We couldn’t sign you out. Check your connection and try again.
        </hm-alert>
      }
      <button footer hmButton type="button" [disabled]="busy()" (click)="cancel()">Cancel</button>
      <button footer hmButton="primary" type="button" [busy]="busy()" [disabled]="busy()" (click)="confirm()">
        @if (busy()) {
          <span class="spinner" aria-hidden="true"></span>Signing out…
        } @else {
          <hm-icon name="logout" />Sign out
        }
      </button>
    </hm-dialog>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignOutDialogComponent {
  private readonly session = inject(SessionStore);
  readonly closed = output<'signed-out' | 'cancelled'>();
  readonly busy = signal(false);
  readonly failed = signal(false);

  cancel(): void {
    if (!this.busy()) this.closed.emit('cancelled');
  }

  async confirm(): Promise<void> {
    this.busy.set(true);
    this.failed.set(false);
    const result = await this.session.signOut();
    this.busy.set(false);
    if (result.ok) this.closed.emit('signed-out');
    else this.failed.set(true);
  }
}

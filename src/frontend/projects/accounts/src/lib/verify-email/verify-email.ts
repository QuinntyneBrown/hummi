import { ChangeDetectionStrategy, Component, OnInit, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthApi, SessionStore } from '@hummi/api';
import { AuthCardComponent, ButtonDirective, ProgressComponent, ToastService } from '@hummi/components';

/**
 * Verify email (`/verify-email?token=`, L2-028): redeems the token on arrival with an indeterminate
 * progress bar, then shows Email confirmed with the listener's name, or This link has expired with
 * Send a new link for the same address and Back to sign in.
 */
@Component({
  selector: 'hm-verify-email',
  imports: [RouterLink, AuthCardComponent, ButtonDirective, ProgressComponent],
  template: `
    @switch (state()) {
      @case ('confirming') {
        <hm-auth-card heading="Confirming your email…">
          <span intro>This takes a moment. You’ll be taken to Hummi when it’s done.</span>
          <hm-progress label="Confirming email" />
        </hm-auth-card>
      }
      @case ('confirmed') {
        <hm-auth-card heading="Email confirmed">
          <span intro>You’re all set, {{ name() }}. Your account is ready.</span>
          <a hmButton="primary" [block]="true" [large]="true" routerLink="/">Start listening</a>
        </hm-auth-card>
      }
      @case ('expired') {
        <hm-auth-card heading="This link has expired">
          <span intro>Confirmation links work for 24 hours. We can send a fresh one.</span>
          <button
            hmButton="primary"
            [block]="true"
            [large]="true"
            type="button"
            [busy]="sending()"
            [disabled]="sending()"
            (click)="resend()"
          >
            Send a new link
          </button>
          <a hmButton="ghost" [block]="true" routerLink="/sign-in">Back to sign in</a>
        </hm-auth-card>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyEmailComponent implements OnInit {
  private readonly auth = inject(AuthApi);
  private readonly session = inject(SessionStore);
  private readonly toasts = inject(ToastService);
  readonly token = input<string>();

  readonly state = signal<'confirming' | 'confirmed' | 'expired'>('confirming');
  readonly name = signal('');
  readonly sending = signal(false);

  async ngOnInit(): Promise<void> {
    const result = await this.auth.verifyEmail(this.token() ?? '');
    if (result.ok) {
      this.name.set(result.value.displayName);
      this.state.set('confirmed');
      // A signed-in listener's banner goes away (L2-028 AC4).
      if (this.session.signedIn()) void this.session.reload();
    } else {
      this.state.set('expired');
    }
  }

  async resend(): Promise<void> {
    this.sending.set(true);
    const result = await this.auth.resendConfirmation(this.token());
    this.sending.set(false);
    this.toasts.show(
      result.ok ? 'We sent a new confirmation link' : 'We couldn’t send the email. Try again in a minute.',
    );
  }
}

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthApi } from '@hummi/api';
import {
  AlertComponent,
  AuthCardComponent,
  ButtonDirective,
  ErrorSummaryComponent,
  TextFieldComponent,
} from '@hummi/components';

import { FieldErrors, fromProblem, summaryOf } from '../shared/form-state';

const IDS = { email: 'email' };

/**
 * Reset password (`/reset-password`, L2-030): asks for the email and shows Check your inbox whether or
 * not an account exists. Only an email-delivery failure shows the danger alert (ADR 0011).
 */
@Component({
  selector: 'hm-reset-password',
  imports: [RouterLink, AlertComponent, AuthCardComponent, ButtonDirective, ErrorSummaryComponent, TextFieldComponent],
  template: `
    @if (sentTo(); as address) {
      <hm-auth-card heading="Check your inbox">
        <span intro
          >If an account exists for <strong>{{ address }}</strong
          >, a reset link is on its way. It works for 1 hour.</span
        >
        <a hmButton="primary" [block]="true" [large]="true" routerLink="/sign-in">Back to sign in</a>
      </hm-auth-card>
    } @else {
      <hm-auth-card heading="Reset your password">
        <span intro>Enter your email and we’ll send a link to choose a new one.</span>
        <form class="stack" novalidate (submit)="submit($event)">
          @for (n of [attempt()]; track n) {
            @if (summary().length) {
              <hm-error-summary [errors]="summary()" />
            }
          }
          @if (failed()) {
            <hm-alert tone="danger" heading="We couldn’t send the email">
              Try again in a minute. If it keeps happening, contact support.
            </hm-alert>
          }
          <hm-text-field
            label="Email"
            [fieldId]="ids.email"
            type="email"
            autocomplete="email"
            [required]="true"
            [readonly]="busy()"
            [error]="errors()['email'] ?? ''"
            [(value)]="email"
          />
          <button hmButton="primary" [block]="true" [large]="true" type="submit" [busy]="busy()" [disabled]="busy()">
            @if (busy()) {
              <span class="spinner" aria-hidden="true"></span>Send reset link…
            } @else {
              Send reset link
            }
          </button>
        </form>
        <a footer hmButton="ghost" [block]="true" routerLink="/sign-in" style="margin-top: var(--space-2)"
          >Back to sign in</a
        >
      </hm-auth-card>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent {
  private readonly auth = inject(AuthApi);

  readonly email = signal('');
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly sentTo = signal<string | null>(null);
  readonly errors = signal<FieldErrors>({});
  readonly attempt = signal(0);
  readonly summary = computed(() => summaryOf(this.errors(), IDS));
  readonly ids = IDS;

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.failed.set(false);
    const address = this.email().trim();
    this.errors.set(address ? {} : { email: 'Enter the email you signed up with' });
    if (!address) {
      this.attempt.update((n) => n + 1);
      return;
    }
    this.busy.set(true);
    const result = await this.auth.requestPasswordReset(address);
    this.busy.set(false);
    if (result.ok) {
      this.sentTo.set(address);
    } else if (result.problem.status === 422) {
      this.errors.set(fromProblem(result.problem.errors));
      this.attempt.update((n) => n + 1);
    } else {
      this.failed.set(true);
    }
  }
}

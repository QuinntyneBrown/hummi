import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
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

const IDS = { password: 'password' };
const MIN_LENGTH = 10;

/**
 * New password (`/new-password?token=`, L2-055): the page a reset link opens. A short password is refused
 * before the link is spent; an unknown, used or expired link shows This link has expired; any other failure
 * shows a danger alert above the field (ADR 0011). Success signs out every session and offers Sign in.
 */
@Component({
  selector: 'hm-new-password',
  imports: [RouterLink, AlertComponent, AuthCardComponent, ButtonDirective, ErrorSummaryComponent, TextFieldComponent],
  template: `
    @switch (state()) {
      @case ('changed') {
        <hm-auth-card heading="Password changed">
          <span intro>Sign in with your new password.</span>
          <a hmButton="primary" [block]="true" [large]="true" routerLink="/sign-in">Sign in</a>
        </hm-auth-card>
      }
      @case ('expired') {
        <hm-auth-card heading="This link has expired">
          <span intro>Reset links work for 1 hour. Request a new one to choose a password.</span>
          <a hmButton="primary" [block]="true" [large]="true" routerLink="/reset-password">Request a new link</a>
          <a hmButton="ghost" [block]="true" routerLink="/sign-in">Back to sign in</a>
        </hm-auth-card>
      }
      @default {
        <hm-auth-card heading="Choose a new password">
          <span intro>Pick a new password for your Hummi account.</span>
          <form class="stack" novalidate (submit)="submit($event)">
            @for (n of [attempt()]; track n) {
              @if (summary().length) {
                <hm-error-summary [errors]="summary()" />
              }
            }
            @if (failed()) {
              <hm-alert tone="danger" heading="We couldn’t change your password">Try again in a minute.</hm-alert>
            }
            <hm-text-field
              label="New password"
              [fieldId]="ids.password"
              type="password"
              autocomplete="new-password"
              help="At least 10 characters"
              [required]="true"
              [readonly]="busy()"
              [error]="errors()['password'] ?? ''"
              [(value)]="password"
            />
            <button hmButton="primary" [block]="true" [large]="true" type="submit" [busy]="busy()" [disabled]="busy()">
              @if (busy()) {
                <span class="spinner" aria-hidden="true"></span>Change password…
              } @else {
                Change password
              }
            </button>
          </form>
          <a footer hmButton="ghost" [block]="true" routerLink="/sign-in" style="margin-top: var(--space-2)"
            >Back to sign in</a
          >
        </hm-auth-card>
      }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPasswordComponent {
  private readonly auth = inject(AuthApi);
  readonly token = input<string>();

  readonly password = signal('');
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly state = signal<'form' | 'changed' | 'expired'>('form');
  readonly errors = signal<FieldErrors>({});
  readonly attempt = signal(0);
  readonly summary = computed(() => summaryOf(this.errors(), IDS));
  readonly ids = IDS;

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.failed.set(false);
    const short = this.password().length < MIN_LENGTH;
    this.errors.set(short ? { password: 'Use at least 10 characters' } : {});
    if (short) {
      this.attempt.update((n) => n + 1);
      return;
    }
    this.busy.set(true);
    const result = await this.auth.resetPassword(this.token() ?? '', this.password());
    this.busy.set(false);
    if (result.ok) {
      this.state.set('changed');
    } else if (result.problem.status === 410) {
      this.state.set('expired');
    } else if (result.problem.status === 422) {
      this.errors.set(fromProblem(result.problem.errors));
      this.attempt.update((n) => n + 1);
    } else {
      this.failed.set(true);
    }
  }
}

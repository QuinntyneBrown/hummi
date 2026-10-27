import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SessionStore } from '@hummi/api';
import {
  AlertComponent,
  AuthCardComponent,
  ButtonDirective,
  CheckboxComponent,
  ErrorSummaryComponent,
  TextFieldComponent,
} from '@hummi/components';

import { FieldErrors, fromProblem, safeReturnUrl, summaryOf } from '../shared/form-state';

const IDS = { email: 'email', password: 'password' };

/**
 * Sign in (`/sign-in`, L2-029): email and password are the only method; Keep me signed in is checked by
 * default. A wrong email or password shows one alert that does not say which was wrong. Success opens
 * the return URL from the Sign in to save this prompt, or Home.
 */
@Component({
  selector: 'hm-sign-in',
  imports: [
    RouterLink,
    AlertComponent,
    AuthCardComponent,
    ButtonDirective,
    CheckboxComponent,
    ErrorSummaryComponent,
    TextFieldComponent,
  ],
  templateUrl: './sign-in.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  private readonly session = inject(SessionStore);
  private readonly router = inject(Router);
  readonly returnUrl = input<string>();

  readonly email = signal('');
  readonly password = signal('');
  readonly keepSignedIn = signal(true);
  readonly busy = signal(false);
  /** 'mismatch' for a wrong email or password, 'failed' for anything else. */
  readonly problem = signal<'mismatch' | 'failed' | null>(null);
  readonly errors = signal<FieldErrors>({});
  readonly attempt = signal(0);
  readonly summary = computed(() => summaryOf(this.errors(), IDS));
  readonly ids = IDS;

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.problem.set(null);
    const errors: FieldErrors = {};
    if (!this.email().trim()) errors['email'] = 'Enter the email you signed up with';
    if (!this.password()) errors['password'] = 'Enter your password';
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.attempt.update((n) => n + 1);
      return;
    }
    this.busy.set(true);
    const result = await this.session.signIn(this.email().trim(), this.password(), this.keepSignedIn());
    this.busy.set(false);
    if (result.ok) {
      await this.router.navigateByUrl(safeReturnUrl(this.returnUrl()));
    } else if (result.problem.status === 422) {
      this.errors.set(fromProblem(result.problem.errors));
      this.attempt.update((n) => n + 1);
    } else {
      this.problem.set(result.problem.code === 'INVALID_CREDENTIALS' ? 'mismatch' : 'failed');
    }
  }
}

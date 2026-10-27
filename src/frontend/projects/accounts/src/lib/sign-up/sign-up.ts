import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthApi } from '@hummi/api';
import {
  AlertComponent,
  AuthCardComponent,
  ButtonDirective,
  CheckboxComponent,
  ErrorSummaryComponent,
  TextFieldComponent,
} from '@hummi/components';

import { EMAIL_PATTERN, FieldErrors, fromProblem, summaryOf } from '../shared/form-state';

const IDS = { displayName: 'name', email: 'email', password: 'password', acceptedTerms: 'terms' };

/**
 * Sign up (`/sign-up`, L2-027): display name, email, a password of at least 10 characters and the terms.
 * Invalid input shows the error summary and the field messages; while submitting the fields are
 * read-only; success shows Check your inbox; a server failure shows the danger alert.
 */
@Component({
  selector: 'hm-sign-up',
  imports: [
    RouterLink,
    AlertComponent,
    AuthCardComponent,
    ButtonDirective,
    CheckboxComponent,
    ErrorSummaryComponent,
    TextFieldComponent,
  ],
  templateUrl: './sign-up.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  private readonly auth = inject(AuthApi);
  /** Where Sign in links back to, from the Sign in to save this prompt (L2-032 AC3). */
  readonly returnUrl = input<string>();

  readonly displayName = signal('');
  readonly email = signal('');
  readonly password = signal('');
  readonly acceptedTerms = signal(true);
  readonly busy = signal(false);
  readonly failed = signal(false);
  readonly created = signal<string | null>(null);
  readonly errors = signal<FieldErrors>({});
  /** Bumped on each failed submit, so the summary is re-created and takes focus again. */
  readonly attempt = signal(0);
  readonly summary = computed(() => summaryOf(this.errors(), IDS));
  readonly ids = IDS;

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.busy()) return;
    this.failed.set(false);
    const errors = this.validate();
    this.errors.set(errors);
    if (Object.keys(errors).length) {
      this.attempt.update((n) => n + 1);
      return;
    }
    this.busy.set(true);
    const email = this.email().trim();
    const result = await this.auth.signUp({
      displayName: this.displayName().trim(),
      email,
      password: this.password(),
      acceptedTerms: this.acceptedTerms(),
    });
    this.busy.set(false);
    if (result.ok) {
      this.created.set(email);
    } else if (result.problem.status === 422) {
      this.errors.set(fromProblem(result.problem.errors));
      this.attempt.update((n) => n + 1);
    } else {
      this.failed.set(true);
    }
  }

  /** Start again: back to an empty form. */
  startAgain(event: Event): void {
    event.preventDefault();
    this.created.set(null);
    this.password.set('');
  }

  private validate(): FieldErrors {
    const errors: FieldErrors = {};
    if (!this.displayName().trim()) errors['displayName'] = 'Enter a display name';
    if (!EMAIL_PATTERN.test(this.email().trim())) errors['email'] = 'That email address looks incomplete';
    if (this.password().length < 10) errors['password'] = 'Use at least 10 characters';
    if (!this.acceptedTerms()) errors['acceptedTerms'] = 'Agree to the terms to continue';
    return errors;
  }
}

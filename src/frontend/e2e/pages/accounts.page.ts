import type { Locator, Page } from '@playwright/test';

/** What the sign-up, sign-in and verify-email cards share: the heading, intro, alerts and the error summary. */
class AuthCard {
  readonly heading: Locator;
  readonly intro: Locator;
  readonly summary: Locator;
  readonly alert: Locator;
  readonly main: Locator;

  constructor(protected readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.intro = this.main.locator('.auth-card .card > div > p').first();
    this.summary = this.main.locator('.form-summary');
    this.alert = this.main.locator('.alert');
  }

  field(label: string): Locator {
    return this.main.getByLabel(label, { exact: true });
  }

  /** The error message shown under a field. */
  fieldError(label: string): Locator {
    return this.main
      .locator('.field')
      .filter({ has: this.page.getByLabel(label, { exact: true }) })
      .locator('.field__error');
  }

  button(name: string | RegExp): Locator {
    return this.main.getByRole('button', { name });
  }

  link(name: string | RegExp): Locator {
    return this.main.getByRole('link', { name });
  }
}

/** Page object for Sign up (`/sign-up`). */
export class SignUpPage extends AuthCard {
  readonly terms: Locator;

  constructor(page: Page) {
    super(page);
    this.terms = this.main.getByRole('checkbox', { name: /I agree to the terms and the community rules/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/sign-up');
  }

  async fill(name: string, email: string, password: string): Promise<void> {
    await this.field('Display name').fill(name);
    await this.field('Email').fill(email);
    await this.field('Password').fill(password);
  }

  async submit(): Promise<void> {
    await this.button('Create account').click();
  }
}

/** Page object for Sign in (`/sign-in`). */
export class SignInPage extends AuthCard {
  readonly keepSignedIn: Locator;

  constructor(page: Page) {
    super(page);
    this.keepSignedIn = this.main.getByRole('checkbox', { name: 'Keep me signed in' });
  }

  async goto(query = ''): Promise<void> {
    await this.page.goto(`/sign-in${query}`);
  }

  async submit(): Promise<void> {
    await this.button('Sign in').click();
  }
}

/** Page object for Verify email (`/verify-email?token=`). */
export class VerifyEmailPage extends AuthCard {
  readonly progress: Locator;

  constructor(page: Page) {
    super(page);
    this.progress = this.main.getByRole('progressbar', { name: 'Confirming email' });
  }

  async goto(token: string): Promise<void> {
    await this.page.goto(`/verify-email?token=${token}`);
  }
}

/** The account menu, the Sign out dialog, the Sign in to save this prompt and the confirmation banner. */
export class AccountShell {
  readonly avatar: Locator;
  readonly menu: Locator;
  readonly dialog: Locator;
  readonly banner: Locator;

  constructor(private readonly page: Page) {
    this.avatar = page.getByRole('banner').getByRole('button', { name: /^Account: / });
    this.menu = page.getByRole('menu', { name: 'Account' });
    this.dialog = page.getByRole('dialog');
    this.banner = page.locator('.banner');
  }

  dialogButton(name: string): Locator {
    return this.dialog
      .getByRole('button', { name, exact: true })
      .or(this.dialog.getByRole('link', { name, exact: true }));
  }
}

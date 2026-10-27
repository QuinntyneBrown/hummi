import type { Locator, Page } from '@playwright/test';

/** Page object for the app shell: header, primary navigation, main and the player bar. */
export class ShellPage {
  readonly brand: Locator;
  readonly main: Locator;
  readonly skipLink: Locator;
  readonly primaryNav: Locator;
  readonly navToggle: Locator;
  readonly signIn: Locator;
  readonly signUp: Locator;
  readonly player: Locator;

  constructor(private readonly page: Page) {
    this.brand = page.getByRole('link', { name: 'Hummi home' });
    this.main = page.locator('main#main');
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
    this.primaryNav = page.getByRole('navigation', { name: 'Primary' });
    this.navToggle = page.getByRole('button', { name: 'Open navigation' });
    this.signIn = page.getByRole('banner').getByRole('link', { name: 'Sign in' });
    this.signUp = page.getByRole('banner').getByRole('link', { name: 'Sign up' });
    this.player = page.getByRole('region', { name: 'Player' });
  }

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }

  navLink(name: string): Locator {
    return this.primaryNav.getByRole('link', { name, exact: true });
  }
}

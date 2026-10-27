import type { Locator, Page } from '@playwright/test';

/** Page object for the app shell. */
export class ShellPage {
  readonly brand: Locator;
  readonly main: Locator;
  readonly skipLink: Locator;

  constructor(private readonly page: Page) {
    this.brand = page.getByRole('link', { name: 'Hummi home' });
    this.main = page.locator('main#main');
    this.skipLink = page.getByRole('link', { name: 'Skip to content' });
  }

  async goto(path = '/'): Promise<void> {
    await this.page.goto(path);
  }
}

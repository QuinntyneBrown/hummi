import type { Locator, Page } from '@playwright/test';

/** The Share dialog (`hm-share-sheet`): heading, tabs, link or embed code, Copy, Start at and send targets. */
export class ShareSheet {
  readonly dialog: Locator;
  readonly link: Locator;
  readonly code: Locator;
  readonly copy: Locator;
  readonly start: Locator;
  readonly status: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog');
    this.link = this.dialog.locator('.linkbox span');
    this.code = this.dialog.locator('.codebox code');
    this.copy = this.dialog.locator('.copy-btn');
    this.start = this.dialog.getByRole('checkbox', { name: /^Start at/ });
    this.status = this.dialog.getByRole('status');
  }

  tab(name: string): Locator {
    return this.dialog.getByRole('tab', { name, exact: true });
  }

  target(name: string): Locator {
    return this.dialog.getByRole('link', { name, exact: true });
  }
}

/** The shared track landing page (`/s/{code}`). */
export class SharedTrackPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly overline: Locator;
  readonly meta: Locator;
  readonly waveform: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.overline = this.main.locator('.overline');
    this.meta = this.main.locator('.hero .text-muted').first();
    this.waveform = this.main.locator('.wave');
    this.alert = this.main.locator('.alert');
  }

  async goto(code: string): Promise<void> {
    await this.page.goto(`/s/${code}`);
  }

  action(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true }).or(this.main.getByRole('link', { name, exact: true }));
  }
}

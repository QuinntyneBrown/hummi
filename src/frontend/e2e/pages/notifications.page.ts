import type { Locator, Page } from '@playwright/test';

/** Page object for Notifications (`/notifications`) and the header bell. */
export class NotificationsPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly items: Locator;
  readonly empty: Locator;
  readonly markAll: Locator;
  readonly bell: Locator;

  constructor(private readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.subtitle = this.main.locator('.page-header .subtitle');
    this.items = this.main.locator('.notif');
    this.empty = this.main.locator('.empty');
    this.markAll = this.main.getByRole('button', { name: 'Mark all as read' });
    this.bell = page.getByRole('banner').getByRole('link', { name: /^Notifications/ });
  }

  async goto(): Promise<void> {
    await this.page.goto('/notifications');
  }

  /** The item's text without its time. */
  text(index: number): Locator {
    return this.items.nth(index).locator('> div');
  }
}

import type { Locator, Page } from '@playwright/test';

/** Page object for Home: the Recently added shelf, the Top 10 list and the loading and error states. */
export class HomePage {
  readonly recentlyAdded: Locator;
  readonly topTen: Locator;
  readonly busy: Locator;
  readonly error: Locator;
  readonly tryAgain: Locator;
  readonly goHome: Locator;

  constructor(private readonly page: Page) {
    this.recentlyAdded = page.getByRole('group', { name: 'Recently added' });
    this.topTen = page.getByRole('list', { name: 'Top 10 on Hummi this week' });
    this.busy = page.locator('main [aria-busy="true"]');
    this.error = page.getByRole('alert');
    this.tryAgain = this.error.getByRole('button', { name: 'Try again' });
    this.goHome = this.error.getByRole('link', { name: 'Go to Home' });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  row(title: string): Locator {
    return this.topTen.getByRole('listitem').filter({ has: this.page.getByRole('link', { name: title, exact: true }) });
  }

  card(title: string): Locator {
    return this.recentlyAdded.locator('.card-track').filter({ hasText: title });
  }
}

/** Home's billboard, shelves and states beyond the first Home (L2-001, L2-002). */
export class HomeContent {
  readonly billboard: Locator;
  readonly empty: Locator;
  readonly banner: Locator;

  constructor(private readonly page: Page) {
    this.billboard = page.getByRole('region', { name: 'Featured' });
    this.empty = page.locator('main .empty').first();
    this.banner = page.locator('.banner');
  }

  shelf(name: string): Locator {
    return this.page.getByRole('region', { name, exact: true });
  }

  /** The shelf headings, in page order. */
  headings(): Locator {
    return this.page.locator('main .shelf__title');
  }

  card(shelf: string, title: string): Locator {
    return this.shelf(shelf).locator('.card-track').filter({ hasText: title });
  }
}

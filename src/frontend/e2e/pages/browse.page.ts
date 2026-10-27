import type { Locator, Page } from '@playwright/test';

/** Page object for Browse: the header, the Moods shelf, the All genres grid and the error block. */
export class BrowsePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly moods: Locator;
  readonly allGenres: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.subtitle = page.locator('main .page-header .subtitle');
    this.moods = page.getByRole('region', { name: 'Moods' });
    this.allGenres = page.getByRole('region', { name: 'All genres' });
    this.error = page.getByRole('alert');
  }

  async goto(): Promise<void> {
    await this.page.goto('/browse');
  }

  tile(name: string): Locator {
    return this.allGenres.getByRole('link', { name, exact: true });
  }

  mood(name: string): Locator {
    return this.moods.getByRole('link', { name, exact: true });
  }
}

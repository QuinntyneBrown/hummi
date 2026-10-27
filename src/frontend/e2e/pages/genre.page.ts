import type { Locator, Page } from '@playwright/test';

/** Page object for a genre page: header, Play all, Shuffle, the sort chips, the track list and the empty state. */
export class GenrePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly playAll: Locator;
  readonly shuffle: Locator;
  readonly newest: Locator;
  readonly mostPlayed: Locator;
  readonly browseGenres: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', { level: 1 });
    this.subtitle = page.locator('main .page-header .subtitle');
    this.playAll = page.getByRole('button', { name: 'Play all' });
    this.shuffle = page.getByRole('button', { name: 'Shuffle' });
    this.newest = page.getByRole('button', { name: 'Newest' });
    this.mostPlayed = page.getByRole('button', { name: 'Most played' });
    this.browseGenres = page.getByRole('link', { name: 'Browse genres' });
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/genres/${slug}`);
  }

  list(name: string): Locator {
    return this.page.getByRole('list', { name: `${name} tracks` });
  }

  /** The titles of the list's rows, in order. */
  async titles(name: string): Promise<string[]> {
    return this.list(name).locator('.track__title').allInnerTexts();
  }
}

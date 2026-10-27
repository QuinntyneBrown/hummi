import type { Locator, Page } from '@playwright/test';

/** Page object for the search layer: the header pill, the dialog, its bar and its result sections. */
export class SearchLayer {
  readonly pill: Locator;
  readonly dialog: Locator;
  readonly field: Locator;
  readonly clear: Locator;
  readonly close: Locator;
  readonly topResult: Locator;
  readonly artists: Locator;
  readonly songs: Locator;
  readonly recent: Locator;
  readonly sounds: Locator;
  readonly busy: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.pill = page.getByRole('banner').getByRole('button', { name: 'Search songs and artists' }).first();
    this.dialog = page.getByRole('dialog', { name: 'Search' });
    this.field = this.dialog.getByRole('searchbox', { name: 'Search songs and artists' });
    this.clear = this.dialog.getByRole('button', { name: 'Clear', exact: true });
    this.close = this.dialog.getByRole('button', { name: 'Close search' });
    this.topResult = this.dialog.getByRole('region', { name: 'Top result' });
    this.artists = this.dialog.getByRole('region', { name: 'Artists' });
    this.songs = this.dialog.getByRole('region', { name: 'Songs' });
    this.recent = this.dialog.getByRole('region', { name: 'Recent' });
    this.sounds = this.dialog.getByRole('region', { name: 'Browse by sound' });
    this.busy = this.dialog.locator('[aria-busy="true"]');
    this.error = this.dialog.getByRole('alert');
  }

  async open(): Promise<void> {
    await this.pill.click();
  }

  song(title: string): Locator {
    return this.songs.locator('.srow').filter({ hasText: title });
  }
}

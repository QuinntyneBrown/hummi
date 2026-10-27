import type { Locator, Page } from '@playwright/test';

/** What every catalogue page shares: the page header, its overline, the main actions and titled shelves. */
class CataloguePage {
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly overline: Locator;
  readonly main: Locator;

  constructor(protected readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.subtitle = this.main.locator('.page-header .subtitle');
    this.overline = this.main.locator('.overline').first();
  }

  /** A button or link in main, matched by its exact accessible name. */
  action(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true }).or(this.main.getByRole('link', { name, exact: true }));
  }

  shelf(name: string): Locator {
    return this.main.getByRole('region', { name });
  }

  /** The titles of a track list's rows, in order. */
  async titles(list: Locator): Promise<string[]> {
    return list.locator('.track__title').allInnerTexts();
  }
}

/** Page object for a track page: header, actions, waveform, the Details list, the shelves and the withdrawn notice. */
export class TrackPage extends CataloguePage {
  readonly waveform: Locator;
  readonly details: Locator;
  readonly alert: Locator;

  constructor(page: Page) {
    super(page);
    this.waveform = this.main.getByRole('img', { name: /^Waveform/ });
    this.details = this.main.locator('dl.dl');
    this.alert = this.main.locator('.alert');
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/tracks/${slug}`);
  }

  /** The description of one term of the Details list. */
  detail(term: string): Locator {
    return this.details.locator(`dt:text-is("${term}") + dd`);
  }
}

/** Page object for an artist page: header, description, Play, Follow, Share, Popular, Releases and the empty state. */
export class ArtistPage extends CataloguePage {
  readonly description: Locator;
  readonly popular: Locator;
  readonly empty: Locator;

  constructor(page: Page) {
    super(page);
    this.description = this.main.locator('.hero p.text-muted');
    this.popular = this.main.getByRole('list', { name: 'Popular tracks' });
    this.empty = this.main.locator('.empty');
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/artists/${slug}`);
  }
}

/** Page object for an album page: header, actions, the track list and the summary line. */
export class AlbumPage extends CataloguePage {
  readonly summary: Locator;

  constructor(page: Page) {
    super(page);
    this.summary = this.main.locator('.album-summary');
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/albums/${slug}`);
  }

  list(title: string): Locator {
    return this.main.getByRole('list', { name: `${title} tracks` });
  }
}

/** Page object for a licence and credit page: header, the credit alert, the licence table and the Back link. */
export class LicencePage extends CataloguePage {
  readonly alert: Locator;
  readonly table: Locator;

  constructor(page: Page) {
    super(page);
    this.alert = this.main.locator('.alert');
    this.table = this.main.getByRole('table', { name: 'Licences used on Hummi' });
  }

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/tracks/${slug}/licence`);
  }

  /** Each body row as its cells' text: licence, you may, you must. */
  async rows(): Promise<string[][]> {
    const rows = this.table.locator('tbody tr');
    const out: string[][] = [];
    for (let i = 0; i < (await rows.count()); i++) out.push(await rows.nth(i).locator('th, td').allInnerTexts());
    return out;
  }
}

/** Page object for the Not found page (L2-044). */
export class NotFoundPage extends CataloguePage {
  readonly code: Locator;
  readonly text: Locator;

  constructor(page: Page) {
    super(page);
    this.code = this.main.locator('.empty .overline');
    this.text = this.main.locator('.empty p.text-muted');
  }
}

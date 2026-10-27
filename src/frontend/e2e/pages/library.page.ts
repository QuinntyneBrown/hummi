import type { Locator, Page } from '@playwright/test';

/** Page object for Library (`/library`): header, tabs, the tab panel and the empty or signed-out state. */
export class LibraryPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly tablist: Locator;
  readonly panel: Locator;
  readonly empty: Locator;

  constructor(private readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.subtitle = this.main.locator('.page-header .subtitle');
    this.tablist = this.main.getByRole('tablist', { name: 'Library' });
    this.panel = this.main.getByRole('tabpanel');
    this.empty = this.main.locator('.empty');
  }

  async goto(): Promise<void> {
    await this.page.goto('/library');
  }

  tab(name: string): Locator {
    return this.tablist.getByRole('tab', { name, exact: true });
  }

  action(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true }).or(this.main.getByRole('link', { name, exact: true }));
  }

  /** The titles of the tiles or track rows in the open tab. */
  titles(): Locator {
    return this.panel.locator('.tile__title, .track__title');
  }
}

/** Page object for a playlist page (`/playlists/{id}`): header, actions, the selection bar and the rows. */
export class PlaylistPage {
  readonly main: Locator;
  readonly heading: Locator;
  readonly subtitle: Locator;
  readonly list: Locator;
  readonly selectionBar: Locator;
  readonly empty: Locator;

  constructor(private readonly page: Page) {
    this.main = page.locator('main#main');
    this.heading = this.main.getByRole('heading', { level: 1 });
    this.subtitle = this.main.locator('.page-header .subtitle');
    this.list = this.main.locator('ol.track-list');
    this.selectionBar = this.main.getByRole('status').filter({ hasText: 'selected' });
    this.empty = this.main.locator('.empty');
  }

  async goto(id: string): Promise<void> {
    await this.page.goto(`/playlists/${id}`);
  }

  /** The page header's action buttons, in order. */
  actions(): Locator {
    return this.main.locator('.page-header .cluster').getByRole('button');
  }

  action(name: string): Locator {
    return this.main.getByRole('button', { name, exact: true }).or(this.main.getByRole('link', { name, exact: true }));
  }

  select(title: string): Locator {
    return this.list.getByRole('checkbox', { name: `Select ${title}` });
  }

  titles(): Locator {
    return this.list.locator('.track__title');
  }
}

/** The open dialog: its name, description, controls and footer buttons. */
export class DialogPage {
  readonly dialog: Locator;

  constructor(page: Page) {
    this.dialog = page.getByRole('dialog');
  }

  button(name: string): Locator {
    return this.dialog.getByRole('button', { name, exact: true });
  }

  field(label: string): Locator {
    return this.dialog.getByLabel(label, { exact: true });
  }

  choice(name: string): Locator {
    return this.dialog.getByRole('checkbox', { name: new RegExp(`^${name}`) });
  }
}

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

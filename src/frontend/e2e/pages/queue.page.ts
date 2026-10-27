import type { Locator, Page } from '@playwright/test';

/** Page object for the queue drawer, the track menu and the toast region. */
export class QueueDrawer {
  readonly drawer: Locator;
  readonly heading: Locator;
  readonly close: Locator;
  readonly nowPlaying: Locator;
  readonly upNextLabel: Locator;
  readonly clear: Locator;
  readonly empty: Locator;
  readonly moreLabel: Locator;

  constructor(page: Page) {
    this.drawer = page.getByRole('complementary', { name: 'Queue' });
    this.heading = this.drawer.getByRole('heading', { name: 'Queue' });
    this.close = this.drawer.getByRole('button', { name: 'Close queue' });
    this.nowPlaying = this.drawer.locator('.q-row--now');
    this.upNextLabel = this.drawer.locator('.q-label').filter({ hasText: 'Up next' });
    this.clear = this.drawer.getByRole('button', { name: 'Clear' });
    this.empty = this.drawer.locator('.q-empty');
    this.moreLabel = this.drawer.locator('.q-label').filter({ hasText: 'Then, more' });
  }

  /** Titles of the Up next rows, in order. */
  upNextRows(): Locator {
    return this.drawer.locator('.q-row:not(.q-row--now):not(.q-row--more)');
  }

  /** The dimmed "Then, more {genre}" rows. */
  moreRows(): Locator {
    return this.drawer.locator('.q-row--more');
  }
}

/** Page object for the track actions menu. */
export class TrackMenu {
  readonly menu: Locator;

  constructor(page: Page) {
    this.menu = page.getByRole('menu', { name: 'Track actions' });
  }

  item(name: string | RegExp): Locator {
    return this.menu.getByRole('menuitem', { name });
  }
}

/** The polite toast region above the player bar. */
export class Toasts {
  readonly region: Locator;

  constructor(page: Page) {
    this.region = page.locator('.toast-region');
  }

  toast(text: string): Locator {
    return this.region.locator('.toast').filter({ hasText: text });
  }
}

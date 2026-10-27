import type { Locator, Page } from '@playwright/test';

/** Page object for the full-screen Now playing layer (/now-playing). */
export class NowPlayingPage {
  readonly layer: Locator;
  readonly close: Locator;
  readonly from: Locator;
  readonly title: Locator;
  readonly artist: Locator;
  readonly position: Locator;
  readonly elapsed: Locator;
  readonly total: Locator;
  readonly shuffle: Locator;
  readonly repeat: Locator;
  readonly previous: Locator;
  readonly play: Locator;
  readonly pause: Locator;
  readonly next: Locator;
  readonly save: Locator;
  readonly share: Locator;
  readonly queue: Locator;
  readonly more: Locator;
  readonly upNext: Locator;
  readonly alert: Locator;

  constructor(private readonly page: Page) {
    this.layer = page.getByRole('dialog', { name: 'Now playing' });
    this.close = this.layer.getByRole('button', { name: 'Close', exact: true });
    this.from = this.layer.locator('.layer-player__from');
    this.title = this.layer.locator('.layer-player__title');
    this.artist = this.layer.locator('.layer-player__artist');
    this.position = this.layer.getByRole('progressbar', { name: 'Track position' });
    this.elapsed = this.layer.locator('.scrubber time').first();
    this.total = this.layer.locator('.scrubber time').last();
    this.shuffle = this.layer.getByRole('button', { name: 'Shuffle' });
    this.repeat = this.layer.getByRole('button', { name: 'Repeat' });
    this.previous = this.layer.getByRole('button', { name: 'Previous track' });
    this.play = this.layer.getByRole('button', { name: 'Play', exact: true });
    this.pause = this.layer.getByRole('button', { name: 'Pause', exact: true });
    this.next = this.layer.getByRole('button', { name: 'Next track' });
    this.save = this.layer.getByRole('button', { name: /^Saved?$/ });
    this.share = this.layer.getByRole('button', { name: 'Share', exact: true });
    this.queue = this.layer.getByRole('button', { name: 'Queue', exact: true });
    this.more = this.layer.getByRole('button', { name: /^More actions for / });
    this.upNext = this.layer.getByRole('region', { name: 'Up next' });
    this.alert = this.layer.getByRole('alert');
  }

  /** Opens /now-playing directly, as a fresh page load. */
  async goto(): Promise<void> {
    await this.page.goto('/now-playing');
  }

  /** Opens Now playing from the player bar's Expand, keeping what is playing. */
  async open(): Promise<void> {
    await this.page.getByRole('region', { name: 'Player' }).getByRole('button', { name: 'Expand' }).click();
  }

  /** The rows of Up next. */
  upNextRows(): Locator {
    return this.upNext.locator('.srow');
  }

  /** Elapsed playback in seconds, read from the scrubber's "m:ss". */
  async elapsedSeconds(): Promise<number> {
    const [m, s] = (await this.elapsed.innerText()).split(':').map(Number);
    return m * 60 + s;
  }
}

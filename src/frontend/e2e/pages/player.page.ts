import type { Locator, Page } from '@playwright/test';

/** Page object for the persistent player bar. */
export class PlayerBar {
  readonly region: Locator;
  readonly title: Locator;
  readonly artist: Locator;
  readonly play: Locator;
  readonly pause: Locator;
  readonly previous: Locator;
  readonly next: Locator;
  readonly position: Locator;
  readonly elapsed: Locator;
  readonly total: Locator;
  readonly equalizer: Locator;

  constructor(page: Page) {
    this.region = page.getByRole('region', { name: 'Player' });
    this.title = this.region.locator('.pbar__title > span');
    this.artist = this.region.locator('.pbar__artist');
    this.play = this.region.getByRole('button', { name: 'Play', exact: true });
    this.pause = this.region.getByRole('button', { name: 'Pause', exact: true });
    this.previous = this.region.getByRole('button', { name: 'Previous track' });
    this.next = this.region.getByRole('button', { name: 'Next track' });
    this.position = this.region.getByRole('progressbar', { name: 'Track position' });
    this.elapsed = this.region.locator('.scrubber time').first();
    this.total = this.region.locator('.scrubber time').last();
    this.equalizer = this.region.getByRole('img', { name: 'Playing' });
  }

  /** Elapsed playback in seconds, read from the scrubber's "m:ss". */
  async elapsedSeconds(): Promise<number> {
    const [m, s] = (await this.elapsed.innerText()).split(':').map(Number);
    return m * 60 + s;
  }
}

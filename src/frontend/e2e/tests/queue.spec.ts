import {
  expect,
  fakeGenreTracks,
  fakeHome,
  fakeMedia,
  fakePlays,
  fakeSearch,
  TRACKS,
  test,
  type FakeTrack,
} from '../fixtures';
import { HomePage } from '../pages/home.page';
import { NowPlayingPage } from '../pages/now-playing.page';
import { PlayerBar } from '../pages/player.page';
import { QueueDrawer, Toasts, TrackMenu } from '../pages/queue.page';

test.use({ viewport: { width: 1280, height: 800 } });

/** Soca newest first (the fake reverses it for most played): three queued tracks and five that are not. */
const SOCA: FakeTrack[] = [
  TRACKS.bigTruck,
  TRACKS.jouvert,
  TRACKS.roadMarch,
  TRACKS.feathersUp,
  TRACKS.wineSlow,
  TRACKS.chrome,
  TRACKS.redLight,
];

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakePlays(page);
  await fakeMedia(page);
  await fakeGenreTracks(page, { tracks: SOCA });
});

/** Plays the Top 10 (Big Truck Energy, Red Light Riddim, Feathers Up, the long title) from this row. */
async function playTopTen(page: import('@playwright/test').Page, title: string): Promise<void> {
  const home = new HomePage(page);
  await home.goto();
  await home
    .row(title)
    .getByRole('button', { name: `Play ${title}` })
    .click();
  await expect(new PlayerBar(page).region).toBeVisible();
}

test('L2-016 AC1: Queue in the player bar opens a non-modal drawer with Now playing and Up next', async ({ page }) => {
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  const home = new HomePage(page);
  await playTopTen(page, 'Big Truck Energy');

  await player.region.getByRole('button', { name: 'Queue', exact: true }).click();

  await expect(queue.drawer).toBeVisible();
  await expect(queue.heading).toBeVisible();
  await expect(queue.close).toBeVisible();
  await expect(queue.drawer).not.toHaveAttribute('aria-modal', 'true');
  await expect(page.locator('.scrim, .backdrop')).toHaveCount(0);
  const box = (await queue.drawer.boundingBox())!;
  expect(box.x + box.width).toBeGreaterThan(1280 - 24);
  expect(box.y).toBeLessThan(24);
  await expect(queue.nowPlaying).toContainText('Big Truck Energy');
  await expect(queue.nowPlaying.getByRole('img', { name: 'Playing' })).toBeVisible();
  await expect(queue.upNextLabel).toContainText('Up next · 3');
  await expect(queue.upNextRows().locator('.srow__title')).toHaveText([
    'Red Light Riddim',
    'Feathers Up',
    TRACKS.longTitle.title,
  ]);
  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();
  await expect(queue.nowPlaying).toContainText('Feathers Up');
});

test('L2-016 AC1: Queue in Now playing opens the drawer', async ({ page }) => {
  const now = new NowPlayingPage(page);
  const queue = new QueueDrawer(page);
  await playTopTen(page, 'Big Truck Energy');
  await now.open();

  await now.queue.click();

  await expect(queue.drawer).toBeVisible();
  await expect(queue.upNextLabel).toContainText('Up next · 3');
});

test('L2-016 AC2: a row’s remove button removes only that track; Clear empties Up next', async ({ page }) => {
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  await playTopTen(page, 'Big Truck Energy');
  await player.region.getByRole('button', { name: 'Queue', exact: true }).click();

  await queue.drawer.getByRole('button', { name: 'Remove Feathers Up from the queue' }).click();

  await expect(queue.upNextLabel).toContainText('Up next · 2');
  await expect(queue.upNextRows().locator('.srow__title')).toHaveText(['Red Light Riddim', TRACKS.longTitle.title]);

  await queue.clear.click();

  await expect(queue.upNextRows()).toHaveCount(0);
  await expect(queue.upNextLabel).toHaveText('Up next');
  await expect(queue.clear).toHaveCount(0);
  await expect(queue.nowPlaying).toContainText('Big Truck Energy');
  await player.next.click();
  await expect(player.title).toHaveText('Big Truck Energy');
});

test('L2-016 AC3: “Then, more {genre}” lists up to four more tracks of the genre, dimmed, with durations', async ({
  page,
}) => {
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  await playTopTen(page, 'Big Truck Energy');

  await player.region.getByRole('button', { name: 'Queue', exact: true }).click();

  await expect(queue.moreLabel).toHaveText('Then, more Soca');
  await expect(queue.moreRows().locator('.srow__title')).toHaveText([
    'Chrome and Copper',
    'Wine Slow',
    'Road March Riddim',
    'J’ouvert Morning',
  ]);
  await expect(queue.moreRows().first().locator('.srow__dur')).toHaveText('3:10');
  await expect(queue.moreRows().first()).toHaveCSS('opacity', '0.7');
});

test('L2-016 AC4: an empty queue explains how to line tracks up', async ({ page }) => {
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  await playTopTen(page, TRACKS.longTitle.title);

  await player.region.getByRole('button', { name: 'Queue', exact: true }).click();

  await expect(queue.empty).toHaveText('Use Play next or Add to queue on any track to line it up here.');
  await expect(queue.upNextLabel).toHaveText('Up next');
});

test('L2-016 AC5: Add to queue and Play next from a track menu show their toasts and place the track', async ({
  page,
}) => {
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  const menu = new TrackMenu(page);
  const toasts = new Toasts(page);
  await playTopTen(page, 'Big Truck Energy');

  await home.card('Panyard Nights').getByRole('button', { name: 'More actions for Panyard Nights' }).click();
  await expect(menu.menu).toBeVisible();
  await menu.item('Add to queue').click();

  await expect(menu.menu).toHaveCount(0);
  await expect(toasts.toast('Added “Panyard Nights” to your queue')).toBeVisible();
  await expect(toasts.region).toHaveAttribute('aria-live', 'polite');

  await home.row('Red Light Riddim').getByRole('button', { name: 'More actions for Red Light Riddim' }).click();
  await menu.item('Play next').click();
  await expect(toasts.toast('“Red Light Riddim” will play next')).toBeVisible();

  await player.region.getByRole('button', { name: 'Queue', exact: true }).click();
  await expect(queue.upNextRows().locator('.srow__title')).toHaveText([
    'Red Light Riddim',
    'Red Light Riddim',
    'Feathers Up',
    TRACKS.longTitle.title,
    'Panyard Nights',
  ]);
});

test('L2-016 AC5: Add to queue with nothing loaded lines the track up in the player, paused', async ({ page }) => {
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  const menu = new TrackMenu(page);
  const toasts = new Toasts(page);
  await home.goto();

  await home.card('Feathers Up').getByRole('button', { name: 'More actions for Feathers Up' }).click();
  await menu.item('Add to queue').click();

  await expect(toasts.toast('Added “Feathers Up” to your queue')).toBeVisible();
  await expect(player.title).toHaveText('Feathers Up');
  await expect(player.play).toBeVisible();
});

test('L2-016 AC6: Escape or Close closes the drawer', async ({ page }) => {
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  await playTopTen(page, 'Big Truck Energy');
  const open = player.region.getByRole('button', { name: 'Queue', exact: true });

  await open.click();
  await queue.close.click();
  await expect(queue.drawer).toHaveCount(0);

  await open.click();
  await expect(queue.drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(queue.drawer).toHaveCount(0);
});

test('L2-041 AC2: a toast dismisses itself after 4 seconds', async ({ page }) => {
  const home = new HomePage(page);
  const menu = new TrackMenu(page);
  const toasts = new Toasts(page);
  await playTopTen(page, 'Big Truck Energy');

  await home.card('Panyard Nights').getByRole('button', { name: 'More actions for Panyard Nights' }).click();
  await menu.item('Add to queue').click();
  const toast = toasts.toast('Added “Panyard Nights” to your queue');
  await expect(toast).toBeVisible();

  await expect(toast).toHaveCount(0, { timeout: 6_000 });
});

test('L2-053: the track menu shows the track and every item, and More from and Go to open search and the genre', async ({
  page,
}) => {
  await fakeSearch(page);
  const home = new HomePage(page);
  const menu = new TrackMenu(page);
  await home.goto();

  await home.card('Feathers Up').getByRole('button', { name: 'More actions for Feathers Up' }).click();

  await expect(menu.menu).toContainText('Feathers Up');
  await expect(menu.menu).toContainText('Kaiso Collective · 3:42');
  await expect(menu.menu.getByRole('menuitem')).toHaveText([
    'Play next',
    'Add to queue',
    'Save to library',
    'Share',
    'More from Kaiso Collective',
    'Go to Soca',
  ]);
  await expect(menu.item('Play next')).toBeFocused();
  const box = (await menu.menu.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(1280);
  expect(box.y + box.height).toBeLessThanOrEqual(800);

  await menu.item('More from Kaiso Collective').click();
  await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Search songs and artists' })).toHaveValue('Kaiso Collective');
});

test('L2-053 AC4: Go to {genre} opens the genre page', async ({ page }) => {
  const home = new HomePage(page);
  const menu = new TrackMenu(page);
  await home.goto();

  await home.card('Feathers Up').getByRole('button', { name: 'More actions for Feathers Up' }).click();
  await menu.item('Go to Soca').click();

  await expect(page).toHaveURL('/genres/soca');
  await expect(menu.menu).toHaveCount(0);
});

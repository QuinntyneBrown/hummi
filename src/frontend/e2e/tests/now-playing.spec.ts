import { expect, fakeGenres, fakeGenreTracks, fakeHome, fakeMedia, fakePlays, TRACKS, test } from '../fixtures';
import { HomePage } from '../pages/home.page';
import { NowPlayingPage } from '../pages/now-playing.page';
import { PlayerBar } from '../pages/player.page';
import { QueueDrawer, TrackMenu } from '../pages/queue.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakePlays(page);
  await fakeGenreTracks(page);
});

/** Plays the Top 10 from the row with this title, so Up next holds the rows after it. */
async function playTopTen(page: import('@playwright/test').Page, title: string): Promise<void> {
  const home = new HomePage(page);
  await home.goto();
  await home
    .row(title)
    .getByRole('button', { name: `Play ${title}` })
    .click();
  await expect(new PlayerBar(page).region).toBeVisible();
}

test('L2-015 AC1: Now playing opens from the player bar with the track, scrubber and every control', async ({
  page,
}) => {
  await fakeMedia(page);
  const player = new PlayerBar(page);
  const now = new NowPlayingPage(page);
  await playTopTen(page, 'Feathers Up');

  await player.region.getByRole('button', { name: 'Open Now playing' }).click();

  await expect(page).toHaveURL('/now-playing');
  await expect(now.layer).toBeVisible();
  await expect(now.close).toBeVisible();
  await expect(now.from).toHaveText('Playing from Soca');
  await expect(now.layer.locator('.layer-player__art .cover')).toBeVisible();
  await expect(now.title).toHaveText('Feathers Up');
  await expect(now.artist).toHaveText('Kaiso Collective');
  await expect(now.position).toBeVisible();
  await expect(now.total).toHaveText('3:42');
  for (const control of [now.shuffle, now.previous, now.pause, now.next, now.repeat])
    await expect(control).toBeVisible();
  await expect(player.region).toHaveCount(0);

  await now.close.click();
  await player.region.getByRole('button', { name: 'Expand' }).click();
  await expect(now.layer).toBeVisible();
  await now.close.click();
  await player.title.click();
  await expect(now.layer).toBeVisible();
});

test('L2-015 AC2: Shuffle toggles its pressed state and reorders what plays next; turning it off restores the order', async ({
  page,
}) => {
  await page.addInitScript(() => (Math.random = () => 0));
  await fakeMedia(page);
  const now = new NowPlayingPage(page);
  await playTopTen(page, 'Big Truck Energy');
  await now.open();
  await expect(now.upNextRows().locator('.srow__title')).toHaveText(['Red Light Riddim', 'Feathers Up']);
  await expect(now.shuffle).toHaveAttribute('aria-pressed', 'false');

  await now.shuffle.click();

  await expect(now.shuffle).toHaveAttribute('aria-pressed', 'true');
  await expect(now.upNextRows().locator('.srow__title')).toHaveText(['Feathers Up', TRACKS.longTitle.title]);
  await now.next.click();
  await expect(now.title).toHaveText('Feathers Up');

  await now.shuffle.click();

  await expect(now.shuffle).toHaveAttribute('aria-pressed', 'false');
  await expect(now.title).toHaveText('Feathers Up');
  await expect(now.upNextRows().locator('.srow__title')).toHaveText([TRACKS.longTitle.title]);
});

test('L2-015 AC2: Repeat toggles its pressed state and Next on the last track starts the queue again', async ({
  page,
}) => {
  await fakeMedia(page);
  const now = new NowPlayingPage(page);
  await playTopTen(page, TRACKS.longTitle.title);
  await now.open();
  await now.next.click();
  await expect(now.title).toHaveText(TRACKS.longTitle.title);
  await expect(now.repeat).toHaveAttribute('aria-pressed', 'false');

  await now.repeat.click();

  await expect(now.repeat).toHaveAttribute('aria-pressed', 'true');
  await expect(now.upNextRows().locator('.srow__title')).toHaveText(['Big Truck Energy', 'Red Light Riddim']);
  await now.next.click();
  await expect(now.title).toHaveText('Big Truck Energy');

  await now.repeat.click();
  await expect(now.repeat).toHaveAttribute('aria-pressed', 'false');
});

test('L2-015 AC3: Save, Share, Queue and More actions; Queue opens the drawer and More actions the track menu', async ({
  page,
}) => {
  await fakeMedia(page);
  const now = new NowPlayingPage(page);
  const queue = new QueueDrawer(page);
  const menu = new TrackMenu(page);
  await playTopTen(page, 'Feathers Up');
  await now.open();

  await expect(now.save).toHaveText('Save');
  await expect(now.share).toBeVisible();

  await now.more.click();
  await expect(menu.menu).toBeVisible();
  await expect(menu.menu).toContainText('Feathers Up');
  await page.keyboard.press('Escape');
  await expect(menu.menu).toHaveCount(0);
  await expect(now.layer).toBeVisible();

  await now.queue.click();
  await expect(queue.drawer).toBeVisible();
  await expect(queue.nowPlaying).toContainText('Feathers Up');
});

test('L2-015 AC4: Up next lists the next two queued tracks with cover, title, artist and duration', async ({
  page,
}) => {
  await fakeMedia(page);
  const now = new NowPlayingPage(page);
  await playTopTen(page, 'Big Truck Energy');
  await now.open();

  const rows = now.upNextRows();
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0).locator('.cover')).toBeVisible();
  await expect(rows.nth(0).locator('.srow__title')).toHaveText('Red Light Riddim');
  await expect(rows.nth(0).locator('.srow__sub')).toHaveText('Shanique');
  await expect(rows.nth(0).locator('.srow__dur')).toHaveText('3:02');
  await expect(rows.nth(1).locator('.srow__title')).toHaveText('Feathers Up');
});

test('L2-015 AC5: Close or Escape closes Now playing and the player bar remains', async ({ page }) => {
  await fakeMedia(page);
  const player = new PlayerBar(page);
  const now = new NowPlayingPage(page);
  await playTopTen(page, 'Feathers Up');

  await player.region.getByRole('button', { name: 'Expand' }).click();
  await now.close.click();
  await expect(now.layer).toHaveCount(0);
  await expect(page).toHaveURL('/');
  await expect(player.title).toHaveText('Feathers Up');

  await player.region.getByRole('button', { name: 'Expand' }).click();
  await expect(now.layer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(now.layer).toHaveCount(0);
  await expect(player.region).toBeVisible();
});

test('L2-015 AC6: opened directly with nothing playing it says so and offers Browse genres', async ({ page }) => {
  await fakeGenres(page);
  const now = new NowPlayingPage(page);

  await now.goto();

  await expect(now.layer.getByRole('heading', { name: 'Nothing is playing' })).toBeVisible();
  await expect(now.layer).toContainText('Press play on any track and it shows up here with the waveform and queue.');
  await now.layer.getByRole('link', { name: 'Browse genres' }).click();
  await expect(page).toHaveURL('/browse');
  await expect(now.layer).toHaveCount(0);
});

test('L2-015 AC7: a dropped connection shows Playback stopped and resumes from that position once back online', async ({
  page,
  context,
}) => {
  const media = await fakeMedia(page);
  const now = new NowPlayingPage(page);
  await playTopTen(page, 'Feathers Up');
  await now.open();
  await expect.poll(() => now.elapsedSeconds(), { timeout: 10_000 }).toBeGreaterThanOrEqual(2);

  await context.setOffline(true);

  await expect(now.alert).toContainText('Playback stopped');
  await expect(now.play).toBeVisible();
  const text = await now.alert.innerText();
  const match =
    /We lost the connection while streaming Feathers Up\. We’ll resume from (\d+):(\d\d) once you’re back online\./.exec(
      text,
    );
  expect(match).not.toBeNull();
  const resumeAt = Number(match![1]) * 60 + Number(match![2]);
  expect(resumeAt).toBeGreaterThanOrEqual(2);
  const requests = media.requested.length;

  await context.setOffline(false);

  await expect(now.alert).toHaveCount(0);
  await expect(now.pause).toBeVisible();
  expect(media.requested.length).toBeGreaterThan(requests);
  expect(await now.elapsedSeconds()).toBeGreaterThanOrEqual(resumeAt);
});

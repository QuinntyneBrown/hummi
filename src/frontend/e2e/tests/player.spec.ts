import { expect, fakeGenreTracks, fakeHome, fakeMedia, fakePlays, TRACKS, test } from '../fixtures';
import { HomePage } from '../pages/home.page';
import { PlayerBar } from '../pages/player.page';
import { ShellPage } from '../pages/shell.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
});

test('L2-013 AC2: no player bar until a track is played, then it appears', async ({ page }) => {
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await expect(home.topTen).toBeVisible();
  await expect(player.region).toHaveCount(0);

  await home.card('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  await expect(player.region).toBeVisible();
});

test('L2-014 AC1: a signed-out visitor plays a track without being asked to sign in', async ({ page }) => {
  const media = await fakeMedia(page);
  const plays = await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();

  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  await expect(player.pause).toBeVisible();
  await expect.poll(() => player.elapsedSeconds(), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  expect(media.requested).toContain('feathers-up');
  await expect.poll(() => plays.posted).toEqual([{ trackId: 'feathers-up' }]);
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('L2-013 AC1: the player shows the track and every control', async ({ page }) => {
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();

  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  await expect(player.region.locator('.pbar__art .cover')).toBeVisible();
  await expect(player.title).toHaveText('Feathers Up');
  await expect(player.artist).toHaveText('Kaiso Collective');
  await expect(player.region.getByRole('button', { name: 'Open Now playing' })).toBeVisible();
  await expect(player.region.getByRole('button', { name: 'Like Feathers Up' })).toBeVisible();
  await expect(player.region.getByRole('button', { name: 'More actions' })).toBeVisible();
  await expect(player.previous).toBeVisible();
  await expect(player.pause).toBeVisible();
  await expect(player.next).toBeVisible();
  await expect(player.position).toBeVisible();
  await expect(player.total).toHaveText('3:42');
  for (const name of ['Share', 'Queue', 'Volume', 'Expand']) {
    await expect(player.region.getByRole('button', { name, exact: true })).toBeVisible();
  }
});

test('L2-013 AC3: Pause pauses and becomes Play; Play resumes; a playing track shows the equaliser', async ({
  page,
}) => {
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();
  await expect.poll(() => player.elapsedSeconds(), { timeout: 10_000 }).toBeGreaterThanOrEqual(1);
  await expect(player.equalizer).toBeVisible();

  await player.pause.click();
  await expect(player.play).toBeVisible();
  await expect(player.equalizer).toHaveCount(0);
  const paused = await player.elapsedSeconds();
  await page.waitForTimeout(1500);
  expect(await player.elapsedSeconds()).toBe(paused);

  await player.play.click();
  await expect(player.pause).toBeVisible();
  await expect.poll(() => player.elapsedSeconds(), { timeout: 10_000 }).toBeGreaterThan(paused);
});

test('L2-013 AC4: Next track and Previous track play the neighbouring queued tracks', async ({ page }) => {
  const media = await fakeMedia(page);
  const plays = await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await home.row('Big Truck Energy').getByRole('button', { name: 'Play Big Truck Energy' }).click();
  await expect(player.title).toHaveText('Big Truck Energy');

  await player.next.click();
  await expect(player.title).toHaveText('Red Light Riddim');
  await expect(player.pause).toBeVisible();

  await player.previous.click();
  await expect(player.title).toHaveText('Big Truck Energy');
  expect(media.requested).toContain('red-light-riddim');
  await expect
    .poll(() => plays.posted.map((p) => p.trackId))
    .toEqual(['big-truck-energy', 'red-light-riddim', 'big-truck-energy']);
});

test('L2-005 AC2: the playing track’s row is marked current with the equaliser instead of its number', async ({
  page,
}) => {
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  await home.goto();

  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  const row = home.row('Feathers Up');
  await expect(row).toHaveAttribute('aria-current', 'true');
  await expect(row.getByRole('img', { name: 'Playing' })).toBeVisible();
  await expect(row.getByRole('button', { name: 'Play Feathers Up' })).not.toContainText('3');
  await expect(home.row('Big Truck Energy')).not.toHaveAttribute('aria-current', 'true');
});

test('L2-013 AC6: when the connection drops the meta line reads Playback stopped', async ({ page }) => {
  await fakeMedia(page, { dropConnection: true });
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();

  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  await expect(player.artist).toHaveText('Playback stopped. Check your connection.');
  await expect(player.play).toBeVisible();
});

test('the player bar stays across pages and hides on pages whose route says so (the not-found page)', async ({
  page,
}) => {
  await fakeMedia(page);
  await fakePlays(page);
  await fakeGenreTracks(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  const shell = new ShellPage(page);
  await home.goto();
  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();
  await expect(player.region).toBeVisible();

  await shell.navLink('Soca').click();
  await expect(page.getByRole('heading', { name: 'Soca', level: 1 })).toBeVisible();
  await expect(player.title).toHaveText('Feathers Up');

  await shell.navLink('Your library').click();
  await expect(page.getByRole('heading', { name: 'We couldn’t find that page' })).toBeVisible();
  await expect(player.region).toHaveCount(0);

  await shell.navLink('Home').click();
  await expect(player.region).toBeVisible();
  await expect(player.title).toHaveText('Feathers Up');
});

test('L2-048 AC4: every player control is reachable with Tab and labelled', async ({ page }) => {
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await home
    .row(TRACKS.longTitle.title)
    .getByRole('button', { name: `Play ${TRACKS.longTitle.title}` })
    .click();
  await expect(player.region).toBeVisible();

  const buttons = player.region.getByRole('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThanOrEqual(11);
  for (let i = 0; i < count; i++) {
    const button = buttons.nth(i);
    expect((await button.getAttribute('aria-label'))?.length ?? (await button.innerText()).length).toBeGreaterThan(0);
    await button.focus();
    await expect(button).toBeFocused();
  }
  await player.pause.focus();
  await page.keyboard.press('Enter');
  await expect(player.play).toBeVisible();
});

test('L2-050 AC3: at 360px the player bar fits without horizontal page scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();

  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  await expect(player.pause).toBeInViewport();
  const box = await player.region.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(360);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
});

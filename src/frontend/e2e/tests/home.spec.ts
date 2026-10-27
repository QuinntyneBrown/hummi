import { expect, fakeHome, TRACKS, test } from '../fixtures';
import { HomePage } from '../pages/home.page';

test('L2-039 AC1: while its data has not arrived, Home shows busy skeletons in its layout', async ({ page }) => {
  await fakeHome(page, { delayMs: 1500 });
  const home = new HomePage(page);
  await home.goto();

  await expect(home.busy.first()).toBeVisible();
  await expect(page.locator('main .skeleton').first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recently added' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Top 10 on Hummi this week' })).toBeVisible();

  await expect(home.topTen).toBeVisible();
  await expect(home.busy).toHaveCount(0);
});

test('L2-040 AC1: a failed load shows the error block with Try again and Go to Home', async ({ page }) => {
  await fakeHome(page, { status: 500 });
  const home = new HomePage(page);
  await home.goto();

  await expect(home.error.getByRole('heading', { name: 'We couldn’t load this page' })).toBeVisible();
  await expect(home.error).toContainText(
    'The server didn’t answer in time. Your music hasn’t gone anywhere; try again in a moment.',
  );
  await expect(home.tryAgain).toBeVisible();
  await expect(home.goHome).toHaveAttribute('href', '/');
});

test('L2-040 AC2: Try again requests the data again', async ({ page }) => {
  const failing = await fakeHome(page, { status: 500 });
  const home = new HomePage(page);
  await home.goto();
  await expect(home.tryAgain).toBeVisible();
  expect(failing.calls()).toBe(1);

  const working = await fakeHome(page);
  await home.tryAgain.click();

  await expect(home.topTen).toBeVisible();
  expect(working.calls()).toBe(1);
  await expect(home.error).toHaveCount(0);
});

test('L2-005 AC1: each row shows its number, cover, title linking to the track and "{artist} · {duration}"', async ({
  page,
}) => {
  await fakeHome(page);
  const home = new HomePage(page);
  await home.goto();

  const row = home.row('Feathers Up');
  await expect(row.getByRole('button', { name: 'Play Feathers Up' })).toHaveText('3');
  await expect(row.locator('.cover')).toBeVisible();
  await expect(row.getByRole('link', { name: 'Feathers Up' })).toHaveAttribute('href', '/tracks/feathers-up');
  await expect(row).toContainText('Kaiso Collective · 3:42');
  await expect(home.topTen.getByRole('listitem')).toHaveCount(4);
});

test('L2-005 AC3: rows carry like and More actions buttons labelled with the title', async ({ page }) => {
  await fakeHome(page);
  const home = new HomePage(page);
  await home.goto();

  const like = home.row('Feathers Up').getByRole('button', { name: 'Like Feathers Up' });
  await expect(like).toHaveAttribute('aria-pressed', 'false');
  const liked = home.row('Red Light Riddim').getByRole('button', { name: 'Remove like from Red Light Riddim' });
  await expect(liked).toHaveAttribute('aria-pressed', 'true');
  await expect(home.row('Feathers Up').getByRole('button', { name: 'More actions for Feathers Up' })).toBeVisible();
});

test('L2-005 AC4: a long title truncates without breaking the row', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 740 });
  await fakeHome(page);
  const home = new HomePage(page);
  await home.goto();

  const longRow = home.row(TRACKS.longTitle.title);
  const shortRow = home.row('Feathers Up');
  const title = longRow.getByRole('link', { name: TRACKS.longTitle.title });
  await expect(title).toBeVisible();

  const [longBox, shortBox] = [await longRow.boundingBox(), await shortRow.boundingBox()];
  expect(longBox?.height).toBe(shortBox?.height);
  expect(longBox?.width).toBe(shortBox?.width);
  const truncated = await longRow
    .locator('.track__title')
    .evaluate((el) => el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === 'ellipsis');
  expect(truncated).toBe(true);
  await expect(longRow.getByRole('button', { name: `More actions for ${TRACKS.longTitle.title}` })).toBeInViewport();
});

test('L2-050 AC3: at 360px Home does not scroll sideways; the shelf scrolls within itself', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await fakeHome(page);
  const home = new HomePage(page);
  await home.goto();
  await expect(home.topTen).toBeVisible();

  const pageOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(pageOverflow).toBeLessThanOrEqual(0);
  const shelfScrolls = await home.recentlyAdded.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(shelfScrolls).toBe(true);
});

import {
  EMPTY_LIBRARY,
  NADIA,
  TRACKS,
  expect,
  fakeGenreTracks,
  fakeHome,
  fakeLibrary,
  fakeMedia,
  fakePlays,
  fakeSignedInVisitor,
  test,
} from '../fixtures';
import { HomeContent, HomePage } from '../pages/home.page';
import { PlayerBar } from '../pages/player.page';
import { ShellPage } from '../pages/shell.page';

test.use({ viewport: { width: 1280, height: 800 } });

const SHELF_NAMES = [
  'Recently added',
  'Top 10 on Hummi this week',
  'Soca',
  'Kids',
  'Steelpan & Calypso',
  'Dancehall',
  'Island chill',
];

// ---------------------------------------------------------------- L2-001 Home default content

test('L2-001 AC1, AC2: the billboard shows the featured album, its actions and the Opens with chip', async ({
  page,
}) => {
  await fakeHome(page);
  const home = new HomeContent(page);

  await new HomePage(page).goto();

  await expect(home.billboard.locator('.billboard__kicker')).toHaveText('New album · Carnival 2025');
  await expect(home.billboard.getByRole('heading', { level: 1 })).toHaveText('Mas on the Avenue');
  await expect(home.billboard.locator('.billboard__artist')).toHaveText('Kaiso Collective');
  await expect(home.billboard.locator('.billboard__blurb')).toHaveText(
    'Twelve road-ready tracks recorded live on the Avenue — brass, iron and a whole band of feathers.',
  );
  await expect(home.billboard.locator('.billboard__meta')).toHaveText('12 tracks · 46 min · Free to stream and share');
  await expect(home.billboard.getByRole('button', { name: 'Play album' })).toBeVisible();
  await expect(home.billboard.getByRole('button', { name: 'Add to library' })).toBeVisible();
  await expect(home.billboard.locator('.billboard__chip')).toHaveText(/Opens with\s*Feathers Up/);
});

test('L2-001 AC3: Play album plays the lead track and reads Pause; Add to library shows the toast', async ({
  page,
}) => {
  await fakeHome(page);
  await fakeMedia(page);
  await fakePlays(page);
  await fakeSignedInVisitor(page, NADIA);
  const { writes } = await fakeLibrary(page, { body: EMPTY_LIBRARY });
  const home = new HomeContent(page);
  const player = new PlayerBar(page);
  await new HomePage(page).goto();

  await home.billboard.getByRole('button', { name: 'Play album' }).click();

  await expect(player.title).toHaveText('Feathers Up');
  await expect(home.billboard.getByRole('button', { name: 'Pause' })).toBeVisible();

  await home.billboard.getByRole('button', { name: 'Add to library' }).click();

  await expect(page.getByRole('status').filter({ hasText: 'Added Mas on the Avenue to your library' })).toBeVisible();
  expect(writes.sort()).toEqual(
    [`PUT /api/me/likes/${TRACKS.feathersUp.id}`, `PUT /api/me/likes/${TRACKS.jouvert.id}`].sort(),
  );
});

test('L2-001 AC4: the shelves follow in order with their notes and See all links', async ({ page }) => {
  await fakeHome(page);
  const home = new HomeContent(page);

  await new HomePage(page).goto();

  await expect(home.headings()).toHaveText(SHELF_NAMES);
  await expect(home.shelf('Recently added').locator('.shelf__note')).toHaveText('Fresh this week');
  await expect(home.shelf('Top 10 on Hummi this week').locator('.shelf__note')).toHaveText(
    'Most played across the islands',
  );
  await expect(home.shelf('Soca').locator('.shelf__note')).toHaveText('Road march contenders');
  await expect(home.shelf('Kids').locator('.shelf__note')).toHaveText('Sing-alongs and bedtime songs');
  await expect(home.shelf('Island chill').locator('.shelf__note')).toHaveText('For slow afternoons');
  for (const name of SHELF_NAMES) {
    await expect(home.shelf(name).getByRole('link', { name: 'See all' })).toBeVisible();
  }
  await expect(home.shelf('Soca').getByRole('link', { name: 'See all' })).toHaveAttribute('href', '/genres/soca');
});

test('L2-001 AC5: the Top 10 rows are numbered by rank', async ({ page }) => {
  await fakeHome(page);
  const home = new HomeContent(page);

  await new HomePage(page).goto();

  await expect(home.shelf('Top 10 on Hummi this week').locator('.track__num')).toHaveText(['1', '2', '3', '4']);
});

test('L2-001 AC6: Previous and Next page a rail; New badges show outside Recently added', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 740 });
  await fakeHome(page, { newIds: [TRACKS.bigTruck.id], tracks: { 'recently-added': Object.values(TRACKS) } });
  const home = new HomeContent(page);
  await new HomePage(page).goto();
  const rail = home.shelf('Recently added').locator('.shelf__track');
  await rail.hover();
  await expect(home.shelf('Recently added').getByRole('button', { name: 'Previous' })).toBeVisible();

  await home.shelf('Recently added').getByRole('button', { name: 'Next' }).press('Enter');

  await expect.poll(() => rail.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await expect(home.card('Soca', 'Big Truck Energy').locator('.card-track__new')).toHaveText('New');
  await expect(home.card('Recently added', 'Big Truck Energy').locator('.card-track__new')).toHaveCount(0);
});

test('L2-001 AC7: the current card keeps its play button and shows the equaliser while it plays', async ({ page }) => {
  await fakeHome(page);
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomeContent(page);
  await new HomePage(page).goto();
  const card = home.card('Recently added', 'Feathers Up');

  await card.hover();
  await expect(card.getByRole('button', { name: 'Play Feathers Up' })).toBeVisible();
  await card.getByRole('button', { name: 'Play Feathers Up' }).click();

  await expect(card).toHaveAttribute('aria-current', 'true');
  await expect(card.locator('.eq')).toBeVisible();
});

test('L2-001 AC8: the footer reads the two free-music lines', async ({ page }) => {
  await fakeHome(page);

  await new HomePage(page).goto();

  await expect(page.locator('.site-footer')).toContainText('Every track on Hummi is free to stream and free to share.');
  await expect(page.locator('.site-footer')).toContainText('hummi.fm — free music, made in the open.');
});

// ---------------------------------------------------------------- L2-002 Home empty, partial and offline states

test('L2-002 AC1: a listener with no history sees "Your Home fills up as you listen" and six genres', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
  await fakeHome(page, { hasHistory: false });
  const home = new HomeContent(page);

  await new HomePage(page).goto();

  await expect(home.empty.getByRole('heading')).toHaveText('Your Home fills up as you listen');
  await expect(home.empty).toContainText(
    'Play a few tracks and we’ll line up what to hear next. Pick a genre to begin.',
  );
  await expect(home.empty.getByRole('link', { name: 'Browse genres' })).toHaveAttribute('href', '/browse');
  await expect(home.shelf('Start with a genre').locator('.genre-tile')).toHaveCount(6);
  await expect(home.billboard).toHaveCount(0);
});

test('L2-002 AC2: a failed Soca shelf shows its own error and Try again while the rest renders', async ({ page }) => {
  const fake = await fakeHome(page, { shelves: { soca: 500 } });
  const home = new HomeContent(page);
  await new HomePage(page).goto();

  const soca = home.shelf('Soca');
  await expect(soca.getByRole('alert')).toContainText('Soca didn’t load');
  await expect(soca.getByRole('alert')).toContainText('Everything else on this page still works. Try the shelf again.');
  await expect(home.billboard).toBeVisible();
  await expect(home.shelf('Kids').locator('.card-track')).toHaveCount(1);

  await soca.getByRole('button', { name: 'Try again' }).click();

  await expect.poll(() => fake.shelfCalls('soca')).toBe(2);
});

test('L2-002 AC3: offline, the banner shows and only the billboard and saved shelves render', async ({
  page,
  context,
}) => {
  await fakeHome(page, { shelves: { dancehall: 500 } });
  await fakeGenreTracks(page);
  const home = new HomeContent(page);
  const shell = new ShellPage(page);
  await new HomePage(page).goto();
  await expect(home.shelf('Soca').locator('.card-track')).toHaveCount(2);

  await context.setOffline(true);
  await shell.navLink('Soca').click();
  await shell.navLink('Home').click();

  await expect(home.banner).toContainText(
    'You are offline. Showing what was saved on this device. Playing tracks you have not heard recently needs a connection.',
  );
  await expect(home.billboard).toBeVisible();
  await expect(home.shelf('Soca').locator('.card-track')).toHaveCount(2);
  await expect(home.shelf('Dancehall')).toHaveCount(0);
  await context.setOffline(false);
});

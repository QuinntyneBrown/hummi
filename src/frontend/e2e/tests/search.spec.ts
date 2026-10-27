import {
  DIRECTORY,
  expect,
  fakeGenres,
  fakeGenreTracks,
  fakeHome,
  fakeMedia,
  fakePlays,
  fakeSearch,
  test,
} from '../fixtures';
import { GenrePage } from '../pages/genre.page';
import { HomePage } from '../pages/home.page';
import { SearchLayer } from '../pages/search.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakeGenres(page);
});

test('L2-006 AC1: the header search field opens the overlay with the query field focused', async ({ page }) => {
  const home = new HomePage(page);
  const search = new SearchLayer(page);
  await home.goto();
  await expect(home.topTen).toBeVisible();

  await search.open();

  await expect(search.dialog).toBeVisible();
  await expect(search.field).toBeFocused();
});

test('L2-006 AC1: "/" with no text field focused opens the overlay', async ({ page }) => {
  const home = new HomePage(page);
  const search = new SearchLayer(page);
  await home.goto();
  await expect(home.topTen).toBeVisible();

  await page.keyboard.press('/');

  await expect(search.dialog).toBeVisible();
  await expect(search.field).toBeFocused();
  await expect(search.field).toHaveValue('');
});

test('L2-006 AC1: /search?q= opens the overlay with that query over Home', async ({ page }) => {
  await fakeSearch(page);
  const search = new SearchLayer(page);

  await page.goto('/search?q=pan');

  await expect(search.dialog).toBeVisible();
  await expect(search.field).toHaveValue('pan');
  await expect(search.topResult).toContainText('Panyard Nights');
  await expect(new HomePage(page).topTen).toBeAttached();
});

test('L2-006 AC2: Clear appears only once text is typed and empties the field', async ({ page }) => {
  await fakeSearch(page);
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await expect(search.close).toBeVisible();
  await expect(search.clear).toHaveCount(0);
  await search.field.fill('pan');
  await expect(search.clear).toBeVisible();

  await search.clear.click();

  await expect(search.field).toHaveValue('');
  await expect(search.clear).toHaveCount(0);
  await expect(search.field).toBeFocused();
});

test('L2-006 AC2: Close and Escape close the overlay and leave the page beneath unchanged', async ({ page }) => {
  const home = new HomePage(page);
  const search = new SearchLayer(page);
  await home.goto();
  await expect(home.topTen).toBeVisible();

  await search.open();
  await search.close.click();
  await expect(search.dialog).toHaveCount(0);
  await expect(page).toHaveURL('/');
  await expect(home.topTen).toBeVisible();

  await search.open();
  await page.keyboard.press('Escape');
  await expect(search.dialog).toHaveCount(0);
  await expect(page).toHaveURL('/');
  await expect(search.pill).toBeFocused();
});

test('L2-006 AC3: "pan" shows a Top result card, up to 3 artists and songs with More actions', async ({ page }) => {
  const api = await fakeSearch(page);
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await search.field.fill('pan');

  await expect(search.topResult.locator('.cover')).toBeVisible();
  await expect(search.topResult.locator('strong')).toHaveText('Panyard Nights');
  await expect(search.topResult).toContainText('Laventille Steel Orchestra · 6:40');
  await expect(search.topResult.getByRole('link')).toHaveAttribute('href', '/tracks/panyard-nights');
  await expect(search.artists.getByRole('link')).toHaveText([
    'Laventille Steel Orchestra',
    'Panorama Players',
    'Pan Masters',
  ]);
  await expect(search.artists.getByRole('link').first()).toHaveAttribute('href', '/artists/laventille-steel-orchestra');
  const row = search.song('Panyard Nights');
  await expect(row.locator('.cover')).toBeVisible();
  await expect(row.getByRole('link', { name: 'Panyard Nights' })).toHaveAttribute('href', '/tracks/panyard-nights');
  await expect(row).toContainText('Laventille Steel Orchestra');
  await expect(row).toContainText('6:40');
  await expect(row.getByRole('button', { name: 'More actions for Panyard Nights' })).toBeAttached();
  await expect(search.songs.locator('.srow')).toHaveCount(3);
  expect(api.queries.at(-1)).toBe('pan');
});

test('L2-006 AC4: the current track is marked and shows the equaliser while it plays', async ({ page }) => {
  await fakeSearch(page);
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  const search = new SearchLayer(page);
  await home.goto();
  await home.card('Panyard Nights').getByRole('button', { name: 'Play Panyard Nights' }).click();

  await search.open();
  await search.field.fill('pan');

  const row = search.song('Panyard Nights');
  await expect(row).toHaveAttribute('aria-current', 'true');
  await expect(row.getByRole('img', { name: 'Playing' })).toBeVisible();
  await expect(row.locator('.srow__title')).toHaveCSS('color', await accentColour(page));
  await expect(search.song('Feathers Up')).not.toHaveAttribute('aria-current', 'true');
});

test('L2-006 AC5: skeleton rows show while a search is in progress', async ({ page }) => {
  await fakeSearch(page, { delayMs: 1500 });
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await search.field.fill('pan');

  await expect(search.busy.locator('.skeleton').first()).toBeVisible();
  await expect(search.topResult).toBeVisible();
  await expect(search.busy).toHaveCount(0);
});

test('L2-007 AC1: an empty query shows Recent searches with clock icons and Browse by sound tiles', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'hummi.recent-searches',
      JSON.stringify(['Kaiso Collective', 'panorama', 'lullaby', 'Shanique']),
    ),
  );
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await expect(search.recent.getByRole('heading', { name: 'Recent' })).toBeVisible();
  await expect(search.recent.getByRole('button')).toHaveText(['Kaiso Collective', 'panorama', 'lullaby', 'Shanique']);
  await expect(search.recent.locator('li svg')).toHaveCount(4);
  await expect(search.sounds.getByRole('heading', { name: 'Browse by sound' })).toBeVisible();
  const first = DIRECTORY.genres[0];
  const tile = search.sounds.getByRole('link').first();
  await expect(tile.locator('strong')).toHaveText(first.name);
  await expect(tile.locator('small')).toHaveText(`${first.trackCount.toLocaleString('en-US')} tracks`);
  await expect(search.sounds.getByRole('link')).toHaveCount(DIRECTORY.genres.length);
});

test('L2-007 AC2: a recent search fills the query and runs again; Enter adds a query to Recent', async ({ page }) => {
  const api = await fakeSearch(page);
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();
  await search.field.fill('pan');
  await search.field.press('Enter');
  await expect(search.topResult).toBeVisible();
  await search.close.click();

  await search.open();
  await expect(search.recent.getByRole('button')).toHaveText(['pan']);
  const asked = api.queries.length;
  await search.recent.getByRole('button', { name: 'pan' }).click();

  await expect(search.field).toHaveValue('pan');
  await expect(search.topResult).toContainText('Panyard Nights');
  expect(api.queries.length).toBeGreaterThan(asked);
});

test('L2-007 AC3: a genre tile opens the Genre page and closes the overlay', async ({ page }) => {
  await fakeGenreTracks(page);
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await search.sounds.getByRole('link').first().click();

  await expect(page).toHaveURL('/genres/soca');
  await expect(new GenrePage(page).heading).toHaveText('Soca');
  await expect(search.dialog).toHaveCount(0);
});

test('L2-007 AC4: a query with no matches says nothing matches it', async ({ page }) => {
  await fakeSearch(page);
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await search.field.fill('rainfall in b-flat');

  await expect(search.dialog.getByText('Nothing matches “rainfall in b-flat”')).toBeVisible();
  await expect(search.dialog.getByText('Try an artist name, or a sound like soca, pan or lullaby.')).toBeVisible();
});

test('L2-007 AC5: an unreachable search shows the error and keeps the query in the field', async ({ page }) => {
  await fakeSearch(page, { status: 503 });
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.open();

  await search.field.fill('pan');

  await expect(search.error.getByRole('heading')).toHaveText('Search isn’t working right now');
  await expect(search.error).toContainText(
    'We couldn’t reach search. Your query is still in the box; try again in a moment.',
  );
  await expect(search.field).toHaveValue('pan');
});

test('L2-048 AC4: the search layer is operable with the keyboard alone', async ({ page }) => {
  await fakeSearch(page);
  const search = new SearchLayer(page);
  await new HomePage(page).goto();
  await search.pill.focus();
  await page.keyboard.press('Enter');
  await expect(search.field).toBeFocused();

  await page.keyboard.type('pan');
  await page.keyboard.press('Enter');

  await expect(search.topResult).toBeVisible();
});

/** The computed colour of --color-fg-accent in the current theme. */
async function accentColour(page: import('@playwright/test').Page): Promise<string> {
  return page.evaluate(() => {
    const probe = document.createElement('span');
    probe.style.color = 'var(--color-fg-accent)';
    document.body.append(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return colour;
  });
}

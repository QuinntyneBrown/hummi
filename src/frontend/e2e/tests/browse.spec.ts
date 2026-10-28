import { DIRECTORY, expect, fakeGenres, fakeGenreTracks, test } from '../fixtures';
import { BrowsePage } from '../pages/browse.page';
import { GenrePage } from '../pages/genre.page';

test('L2-003 AC1: Browse is headed "Browse" with the genre and freely licensed track counts', async ({ page }) => {
  await fakeGenres(page);
  const browse = new BrowsePage(page);
  await browse.goto();

  await expect(browse.heading).toHaveText('Browse');
  await expect(browse.subtitle).toHaveText('10 genres · 4,812 freely licensed tracks');
});

test('L2-003 AC2: a Moods shelf of genre chips and an All genres tile for each of the ten genres', async ({ page }) => {
  await fakeGenres(page);
  const browse = new BrowsePage(page);
  await browse.goto();

  await expect(page.getByRole('heading', { name: 'Moods' })).toBeVisible();
  await expect(browse.moods.getByRole('link')).toHaveText(DIRECTORY.moods.map((m) => m.name));
  await expect(page.getByRole('heading', { name: 'All genres' })).toBeVisible();
  await expect(browse.allGenres.locator('.genre-tile')).toHaveText([
    'Soca',
    'Kids',
    'Steelpan & Calypso',
    'Dancehall',
    'Island chill',
    'Parang',
    'Chutney',
    'Reggae',
    'Zouk',
    'Rapso',
  ]);
});

test('L2-003 AC3: a genre tile opens that genre page', async ({ page }) => {
  await fakeGenres(page);
  await fakeGenreTracks(page);
  const browse = new BrowsePage(page);
  await browse.goto();

  await browse.tile('Soca').click();

  await expect(page).toHaveURL('/genres/soca');
  await expect(new GenrePage(page).heading).toHaveText('Soca');
});

test('L2-003 AC3: a mood chip opens that genre page', async ({ page }) => {
  await fakeGenres(page);
  await fakeGenreTracks(page);
  const browse = new BrowsePage(page);
  await browse.goto();

  await expect(browse.mood('Steelpan & Calypso')).toHaveAttribute('href', '/genres/steelpan');
  await browse.mood('Soca').click();

  await expect(page).toHaveURL('/genres/soca');
});

test('L2-003 AC4: a failed load shows "Genres didn’t load" and Browse has no empty state', async ({ page }) => {
  await fakeGenres(page, { status: 500 });
  const browse = new BrowsePage(page);
  await browse.goto();

  await expect(browse.error.getByRole('heading', { name: 'Genres didn’t load' })).toBeVisible();
  await expect(browse.error.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(page.locator('main .empty:not(.empty--error)')).toHaveCount(0);
});

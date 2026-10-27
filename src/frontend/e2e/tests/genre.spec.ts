import { expect, fakeGenres, fakeGenreTracks, fakeMedia, fakePlays, SOCA_NEWEST, test } from '../fixtures';
import { GenrePage } from '../pages/genre.page';
import { PlayerBar } from '../pages/player.page';

test.use({ viewport: { width: 1280, height: 800 } });

const newestTitles = SOCA_NEWEST.map((t) => t.title);

test('L2-004 AC1: /genres/soca is headed "Soca" with the track count and description', async ({ page }) => {
  await fakeGenreTracks(page);
  const genre = new GenrePage(page);
  await genre.goto('soca');

  await expect(genre.heading).toHaveText('Soca');
  await expect(genre.subtitle).toHaveText('1,204 tracks · road-march riddims, J’ouvert mornings and fete anthems');
});

test('L2-004 AC1: choosing "Soca" in the header opens the Soca page', async ({ page }) => {
  await fakeGenres(page);
  await fakeGenreTracks(page);
  await page.goto('/browse');

  await page.getByRole('navigation', { name: 'Primary' }).getByRole('link', { name: 'Soca', exact: true }).click();

  await expect(page).toHaveURL('/genres/soca');
  await expect(new GenrePage(page).heading).toHaveText('Soca');
});

test('L2-004 AC2: Play all, Shuffle and the sort chips with Newest pressed, above a numbered list', async ({
  page,
}) => {
  const fake = await fakeGenreTracks(page);
  const genre = new GenrePage(page);
  await genre.goto('soca');

  await expect(genre.playAll).toBeVisible();
  await expect(genre.shuffle).toBeVisible();
  await expect(genre.newest).toHaveAttribute('aria-pressed', 'true');
  await expect(genre.mostPlayed).toHaveAttribute('aria-pressed', 'false');
  const rows = genre.list('Soca').getByRole('listitem');
  await expect(rows).toHaveCount(4);
  await expect(rows.first().getByRole('button', { name: `Play ${newestTitles[0]}` })).toHaveText('1');
  expect(await genre.titles('Soca')).toEqual(newestTitles);
  expect(fake.sorts).toEqual(['newest']);
});

test('L2-004 AC3: Most played becomes pressed and the list is ordered by play count', async ({ page }) => {
  const fake = await fakeGenreTracks(page);
  const genre = new GenrePage(page);
  await genre.goto('soca');
  await expect(genre.list('Soca')).toBeVisible();

  await genre.mostPlayed.click();

  await expect(genre.mostPlayed).toHaveAttribute('aria-pressed', 'true');
  await expect(genre.newest).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => genre.titles('Soca')).toEqual([...newestTitles].reverse());
  expect(fake.sorts).toEqual(['newest', 'most-played']);
});

test('L2-004 AC4: Play all plays the tracks in list order', async ({ page }) => {
  await fakeGenreTracks(page);
  await fakeMedia(page);
  const plays = await fakePlays(page);
  const genre = new GenrePage(page);
  const player = new PlayerBar(page);
  await genre.goto('soca');

  await genre.playAll.click();

  await expect(player.title).toHaveText(newestTitles[0]);
  await player.next.click();
  await expect(player.title).toHaveText(newestTitles[1]);
  await expect.poll(() => plays.posted.map((p) => p.trackId)).toEqual([SOCA_NEWEST[0].id, SOCA_NEWEST[1].id]);
});

test('L2-004 AC4: Shuffle plays the tracks in a random order', async ({ page }) => {
  // A fixed Math.random makes the permutation predictable: every draw picks index 0.
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await fakeGenreTracks(page);
  await fakeMedia(page);
  await fakePlays(page);
  const genre = new GenrePage(page);
  const player = new PlayerBar(page);
  await genre.goto('soca');

  await genre.shuffle.click();

  // Fisher-Yates drawing j = 0 every time turns [a, b, c, d] into [b, c, d, a].
  const shuffled = [...newestTitles.slice(1), newestTitles[0]];
  for (const [i, title] of shuffled.entries()) {
    await expect(player.title).toHaveText(title);
    if (i < shuffled.length - 1) await player.next.click();
  }
});

test('L2-004 AC5: a genre with no tracks shows the empty state with Browse genres', async ({ page }) => {
  await fakeGenreTracks(page, { empty: true });
  await fakeGenres(page);
  const genre = new GenrePage(page);
  await genre.goto('soca');

  await expect(page.getByRole('heading', { name: 'No Soca tracks yet' })).toBeVisible();
  await expect(page.locator('main .empty')).toContainText(
    'New tracks arrive every day. Try a neighbouring genre while you wait.',
  );
  await expect(genre.playAll).toHaveCount(0);
  await genre.browseGenres.click();
  await expect(page).toHaveURL('/browse');
});

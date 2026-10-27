import {
  EMPTY_LIBRARY,
  LIBRARY,
  NADIA,
  TRACKS,
  expect,
  fakeArtist,
  fakeGenreTracks,
  fakeHome,
  fakeLibrary,
  fakeSignedInVisitor,
  fakeTrack,
  test,
} from '../fixtures';
import { ArtistPage, TrackPage } from '../pages/catalogue.page';
import { GenrePage } from '../pages/genre.page';
import { LibraryPage } from '../pages/library.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
});

// ---------------------------------------------------------------- L2-018 Liking tracks and following artists

test('L2-018 AC1: Like presses the button, renames it and adds the track to Library > Liked', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  let liked = false;
  const { writes } = await fakeLibrary(page, {
    body: () =>
      liked ? { ...EMPTY_LIBRARY, likedCount: 1, liked: [{ ...TRACKS.feathersUp, liked: true }] } : EMPTY_LIBRARY,
  });
  await fakeGenreTracks(page);
  const genre = new GenrePage(page);
  await genre.goto('soca');
  const like = page.getByRole('button', { name: 'Like Feathers Up', exact: true });
  await expect(like).toHaveAttribute('aria-pressed', 'false');

  await like.click();
  liked = true;

  const remove = page.getByRole('button', { name: 'Remove like from Feathers Up', exact: true });
  await expect(remove).toHaveAttribute('aria-pressed', 'true');
  expect(writes).toEqual([`PUT /api/me/likes/${TRACKS.feathersUp.id}`]);

  const library = new LibraryPage(page);
  await library.goto();
  await library.tab('Liked').click();
  await expect(library.titles()).toHaveText(['Feathers Up']);
});

test('L2-018 AC2: Remove like from {title} removes the like', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  const { writes } = await fakeLibrary(page);
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');
  const remove = track.action('Remove like from Feathers Up');
  await expect(remove).toHaveAttribute('aria-pressed', 'true');

  await remove.click();

  await expect(track.action('Like Feathers Up')).toHaveAttribute('aria-pressed', 'false');
  expect(writes).toEqual([`DELETE /api/me/likes/${TRACKS.feathersUp.id}`]);
});

test('L2-018 AC3: Follow on an artist page becomes pressed and the artist appears in Library > Following', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  let following = false;
  const { writes } = await fakeLibrary(page, {
    body: () => (following ? LIBRARY : EMPTY_LIBRARY),
  });
  await fakeArtist(page);
  const artist = new ArtistPage(page);
  await artist.goto('kaiso-collective');
  await expect(artist.action('Follow')).toHaveAttribute('aria-pressed', 'false');

  await artist.action('Follow').click();
  following = true;

  await expect(artist.action('Follow')).toHaveAttribute('aria-pressed', 'true');
  expect(writes).toEqual(['PUT /api/me/follows/kaiso-collective']);
  const library = new LibraryPage(page);
  await library.goto();
  await library.tab('Following').click();
  await expect(library.titles()).toHaveText(['Kaiso Collective']);
});

test('L2-018 AC4: a dropped connection reverts the like and shows the danger toast with Retry', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  const { writes } = await fakeLibrary(page, { body: EMPTY_LIBRARY, writeStatus: 0 });
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  await track.action('Like Feathers Up').click();

  const toast = page.getByRole('alert').filter({ hasText: 'Couldn’t like the track' });
  await expect(toast).toContainText('Check your connection and try again.');
  await expect(track.action('Like Feathers Up')).toHaveAttribute('aria-pressed', 'false');

  await toast.getByRole('button', { name: 'Retry' }).click();

  await expect(toast).toHaveCount(1);
  expect(writes).toEqual([`PUT /api/me/likes/${TRACKS.feathersUp.id}`, `PUT /api/me/likes/${TRACKS.feathersUp.id}`]);
});

// ---------------------------------------------------------------- L2-019 Library

test('L2-019 AC1: Library shows the counts, New playlist and the three tabs with Playlists selected', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
  const library = new LibraryPage(page);

  await library.goto();

  await expect(library.heading).toHaveText('Library');
  await expect(library.subtitle).toHaveText('3 playlists · 2 liked tracks · 1 artist');
  await expect(library.action('New playlist')).toBeVisible();
  await expect(library.tablist.getByRole('tab')).toHaveText(['Playlists', 'Liked', 'Following']);
  await expect(library.tab('Playlists')).toHaveAttribute('aria-selected', 'true');
  await expect(library.tab('Liked')).toHaveAttribute('tabindex', '-1');

  await library.tab('Playlists').press('ArrowRight');

  await expect(library.tab('Liked')).toHaveAttribute('aria-selected', 'true');
  await expect(library.tab('Liked')).toBeFocused();
});

test('L2-019 AC2: the Playlists tab shows a tile per playlist with "{n} tracks · {owner}"', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
  const library = new LibraryPage(page);

  await library.goto();

  await expect(library.titles()).toHaveText(['Road trip to the north coast', 'Rainy-day panyard', 'Sunday kitchen']);
  await expect(library.panel.locator('.tile__meta')).toHaveText([
    '24 tracks · Nadia Charles',
    '18 tracks · Nadia Charles',
    '31 tracks · Mei Rodríguez',
  ]);
});

test('L2-019 AC3: an empty library shows "Your library is empty" with Create a playlist and Browse genres', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
  const library = new LibraryPage(page);

  await library.goto();

  await expect(library.empty.getByRole('heading')).toHaveText('Your library is empty');
  await expect(library.empty).toContainText(
    'Like a track or create a playlist and it will live here, on every device you sign in on.',
  );
  await expect(library.action('Create a playlist')).toBeVisible();
  await expect(library.action('Browse genres')).toHaveAttribute('href', '/browse');
  await expect(library.tablist).toHaveCount(0);
});

test('L2-019 AC4: a signed-out visitor sees "Sign in to see your library" and nothing is requested', async ({
  page,
}) => {
  const { reads } = await fakeLibrary(page);
  const library = new LibraryPage(page);

  await library.goto();

  await expect(library.empty.getByRole('heading')).toHaveText('Sign in to see your library');
  await expect(library.empty).toContainText('Playlists and liked tracks are saved to your account.');
  await expect(library.action('Sign in')).toHaveAttribute('href', '/sign-in?returnUrl=%2Flibrary');
  await expect(library.action('Create account')).toBeVisible();
  expect(reads()).toBe(0);
});

test('L2-019 AC5: a change made on another device shows the next time Library loads', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  let fromOtherDevice = false;
  await fakeLibrary(page, {
    body: () =>
      fromOtherDevice
        ? { ...LIBRARY, likedCount: 3, liked: [{ ...TRACKS.roadMarch, liked: true }, ...LIBRARY.liked] }
        : LIBRARY,
  });
  const library = new LibraryPage(page);
  await library.goto();
  await library.tab('Liked').click();
  await expect(library.titles()).toHaveText(['Feathers Up', 'Panyard Nights']);

  fromOtherDevice = true;
  await page.goto('/');
  await library.goto();
  await library.tab('Liked').click();

  await expect(library.titles()).toHaveText(['Road March Riddim', 'Feathers Up', 'Panyard Nights']);
  await expect(library.subtitle).toHaveText('3 playlists · 3 liked tracks · 1 artist');
});

test('L2-019: a failed load shows "Your library didn’t load" with Try again', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { status: 500 });
  const library = new LibraryPage(page);

  await library.goto();

  await expect(page.getByRole('alert')).toContainText('Your library didn’t load');
  await expect(library.action('Try again')).toBeVisible();
});

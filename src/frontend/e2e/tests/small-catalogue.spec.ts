import type { Page } from '@playwright/test';

import {
  EMPTY_LIBRARY,
  NADIA,
  PIXABAY,
  PIXABAY_ARTIST,
  PIXABAY_DETAIL,
  PIXABAY_SOURCE,
  REGGAE,
  ROAD_TRIP,
  expect,
  fakeArtist,
  fakeGenreTracks,
  fakeGenres,
  fakeHome,
  fakeLibrary,
  fakeMedia,
  fakePlays,
  fakePlaylists,
  fakeSearch,
  fakeSignedInVisitor,
  fakeTrack,
  smallCatalogueDirectory,
  smallCatalogueShelves,
  test,
  type FakeTrack,
} from '../fixtures';
import { BrowsePage } from '../pages/browse.page';
import { ArtistPage, LicencePage, TrackPage } from '../pages/catalogue.page';
import { GenrePage } from '../pages/genre.page';
import { HomeContent, HomePage } from '../pages/home.page';
import { LibraryPage, PlaylistPage } from '../pages/library.page';
import { SearchLayer } from '../pages/search.page';

/**
 * L2-058: every screen works with a catalogue of no tracks, one track or a few (ADR 0021). The API is faked
 * as `hummi seed` leaves it for such a manifest: no albums, so nothing is featured, and no plays.
 */
test.use({ viewport: { width: 1280, height: 800 } });

async function catalogue(page: Page, tracks: FakeTrack[]): Promise<void> {
  await fakeHome(page, { featuredStatus: 404, tracks: smallCatalogueShelves(tracks) });
  await fakeGenres(page, { directory: smallCatalogueDirectory(tracks) });
  await fakeMedia(page);
  await fakePlays(page);
}

async function expectNoSidewaysScroll(page: Page): Promise<void> {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(
    true,
  );
}

// ---------------------------------------------------------------- no tracks

test('L2-002 AC5, L2-058 AC3: with no tracks Home shows "No music yet" and no shelves', async ({ page }) => {
  await catalogue(page, []);
  const home = new HomeContent(page);
  await page.goto('/');

  await expect(home.empty.getByRole('heading', { name: 'No music yet' })).toBeVisible();
  await expect(home.empty).toContainText(
    'Hummi’s catalogue is empty. Tracks appear here once they are imported from Pixabay Music.',
  );
  await expect(home.headings()).toHaveCount(0);
  await expect(home.billboard).toHaveCount(0);

  await home.empty.getByRole('link', { name: 'Browse genres' }).click();
  await expect(page).toHaveURL('/browse');
});

test('L2-003 AC1, L2-058 AC3: with no tracks Browse says so and a genre page shows its empty state', async ({
  page,
}) => {
  await catalogue(page, []);
  await fakeGenreTracks(page, { empty: true, trackCount: 0, genre: REGGAE });
  const browse = new BrowsePage(page);
  const genre = new GenrePage(page);

  await page.goto('/browse');
  await expect(browse.subtitle).toHaveText('10 genres · no tracks yet');

  await genre.goto('reggae');
  await expect(page.getByRole('heading', { name: 'No Reggae tracks yet' })).toBeVisible();
  await expect(genre.browseGenres).toBeVisible();
});

// ---------------------------------------------------------------- one track

test('L2-002 AC4, L2-058 AC1: with one track Home shows it in Recently added and Top 10 and hides empty shelves', async ({
  page,
}) => {
  await catalogue(page, [PIXABAY.first]);
  const home = new HomePage(page);
  const content = new HomeContent(page);
  await home.goto();

  await expect(home.card('Fixture Song')).toBeVisible();
  await expect(home.topTen.getByRole('listitem')).toHaveCount(1);
  await expect(home.row('Fixture Song')).toContainText('1');
  await expect(content.headings()).toHaveText(['Recently added', 'Top 10 on Hummi this week']);
  await expect(content.billboard).toHaveCount(0);
  await expect(content.empty).toHaveCount(0);
});

test('L2-058 AC1: with one track Home does not scroll sideways at 360px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await catalogue(page, [PIXABAY.first]);
  const home = new HomePage(page);
  await home.goto();
  await expect(home.card('Fixture Song')).toBeVisible();

  await expectNoSidewaysScroll(page);
});

test('L2-003 AC1, L2-058 AC1: with one track Browse counts one freely licensed track', async ({ page }) => {
  await catalogue(page, [PIXABAY.first]);
  const browse = new BrowsePage(page);

  await page.goto('/browse');

  await expect(browse.subtitle).toHaveText('10 genres · 1 freely licensed track');
});

test('L2-058 AC1: with one track its genre page lists it', async ({ page }) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeGenreTracks(page, { tracks: [PIXABAY.first], trackCount: 1, genre: REGGAE });
  const genre = new GenrePage(page);

  await genre.goto('reggae');

  await expect(genre.list('Reggae').locator('.track__title')).toHaveText(['Fixture Song']);
});

test('L2-058 AC1: with one track Search finds it', async ({ page }) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeSearch(page, {
    results: {
      fixture: {
        query: 'fixture',
        topResult: PIXABAY.first,
        artists: [{ slug: 'fixture-artist', name: 'fixture_artist' }],
        songs: [PIXABAY.first],
      },
    },
  });
  const search = new SearchLayer(page);
  await page.goto('/search?q=fixture');

  await expect(search.topResult).toContainText('Fixture Song');
  await expect(search.song('Fixture Song')).toBeVisible();
});

test('L2-008 AC3: a Pixabay track lists its Source on Pixabay and no album or model', async ({ page }) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeTrack(page, { detail: PIXABAY_DETAIL });
  const track = new TrackPage(page);
  await track.goto('fixture-song');

  await expect(track.heading).toHaveText('Fixture Song');
  await expect(track.details.locator('dt')).toHaveText(['Artist', 'Genre', 'Source', 'Licence', 'Plays']);
  const source = track.detail('Source').getByRole('link', { name: 'Pixabay (opens in a new tab)' });
  await expect(source).toHaveAttribute('href', PIXABAY_SOURCE);
  await expect(source).toHaveAttribute('target', '_blank');
  await expect(source).toHaveAttribute('rel', 'noopener noreferrer');
  await expect(track.detail('Licence').getByRole('link', { name: 'Pixabay Content License' })).toHaveAttribute(
    'href',
    '/tracks/fixture-song/licence',
  );
  await expect(track.detail('Plays')).toHaveText('0');
});

test('L2-012 AC1: a Pixabay track’s licence page describes the Pixabay Content License and links to it', async ({
  page,
}) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeTrack(page, { detail: PIXABAY_DETAIL });
  const licence = new LicencePage(page);
  await licence.goto('fixture-song');

  await expect(licence.alert.locator('.alert__title')).toHaveText('Fixture Song is under the Pixabay Content License');
  await expect(licence.alert).toContainText(
    'fixture_artist shared it on Pixabay under the Pixabay Content License. You may use it for free, including commercially, and change it. Credit is not required but is appreciated: “Fixture Song by fixture_artist, from Pixabay.”',
  );
  const terms = licence.alert.getByRole('link', { name: 'Read the Pixabay Content License' });
  await expect(terms).toHaveAttribute('href', 'https://pixabay.com/service/license-summary/');
  await expect(terms).toHaveAttribute('target', '_blank');
  await expect(licence.alert.getByRole('link', { name: 'View on Pixabay' })).toHaveAttribute('href', PIXABAY_SOURCE);
});

test('L2-010 AC1: a Pixabay uploader’s page names no model and shows no empty description', async ({ page }) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeArtist(page, { detail: PIXABAY_ARTIST });
  const artist = new ArtistPage(page);
  await artist.goto('fixture-artist');

  await expect(artist.heading).toHaveText('fixture_artist');
  await expect(artist.overline).toHaveText('Artist');
  await expect(artist.description).toHaveCount(0);
  await expect(artist.popular.locator('.track__title')).toHaveText(['Fixture Song']);
  await expect(artist.shelf('Releases')).toHaveCount(0);
});

test('L2-058 AC1: with one track Library lists it as liked and a playlist holds it', async ({ page }) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, {
    body: { ...EMPTY_LIBRARY, likedCount: 1, liked: [{ ...PIXABAY.first, liked: true }] },
  });
  await fakePlaylists(page, [{ ...ROAD_TRIP, tracks: [PIXABAY.first] }]);
  const library = new LibraryPage(page);
  const playlist = new PlaylistPage(page);

  await library.goto();
  await library.tab('Liked').click();
  await expect(library.titles()).toHaveText(['Fixture Song']);

  await playlist.goto(ROAD_TRIP.id);
  await expect(playlist.titles()).toHaveText(['Fixture Song']);
});

test('L2-058 AC1: with one track the Offline page still works', async ({ page, context }) => {
  await catalogue(page, [PIXABAY.first]);
  await fakeTrack(page, { detail: PIXABAY_DETAIL });
  const home = new HomePage(page);
  await home.goto();
  await expect(home.card('Fixture Song')).toBeVisible();

  // Every lazy page is preloaded after start (ADR 0020); go offline once that is done.
  await page.waitForLoadState('networkidle');
  await context.setOffline(true);
  await page.evaluate(() => {
    history.pushState({}, '', '/tracks/fixture-song');
    dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  });

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You’re offline');
  await context.setOffline(false);
});

// ---------------------------------------------------------------- a few tracks

test('L2-058 AC2: with a few tracks the Top 10 ranks them from 1 and only shelves with tracks show', async ({
  page,
}) => {
  await catalogue(page, [PIXABAY.first, PIXABAY.second, PIXABAY.third]);
  const home = new HomePage(page);
  const content = new HomeContent(page);
  await home.goto();

  await expect(home.topTen.locator('.track__title')).toHaveText(['Fixture Song', 'Second Fixture', 'Third Fixture']);
  await expect(home.topTen.getByRole('listitem').first()).toContainText('1');
  await expect(content.headings()).toHaveText(['Recently added', 'Top 10 on Hummi this week']);
  await expect(home.recentlyAdded.locator('.card-track')).toHaveCount(3);
});

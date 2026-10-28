import {
  expect,
  FEATHERS_UP_DETAIL,
  fakeAlbum,
  fakeArtist,
  fakeMedia,
  fakePlays,
  fakeTrack,
  KAISO_DETAIL,
  PIXABAY_DETAIL,
  test,
} from '../fixtures';
import { AlbumPage, ArtistPage, LicencePage, NotFoundPage } from '../pages/catalogue.page';
import { PlayerBar } from '../pages/player.page';

test.use({ viewport: { width: 1280, height: 800 } });

test('L2-010 AC1: /artists/kaiso-collective shows the name, monthly listeners, model and description', async ({
  page,
}) => {
  await fakeArtist(page);
  const artist = new ArtistPage(page);
  await artist.goto('kaiso-collective');

  await expect(artist.heading).toHaveText('Kaiso Collective');
  await expect(artist.subtitle).toHaveText('48,210 monthly listeners');
  await expect(artist.overline).toHaveText('Artist · openmusic-3b');
  await expect(artist.description).toHaveText(KAISO_DETAIL.description);
  await expect(page).toHaveTitle('Kaiso Collective · Hummi');
});

test('L2-010 AC2: Play, Follow (not pressed), Share, the Popular list and the Releases shelf', async ({ page }) => {
  await fakeArtist(page);
  await fakeAlbum(page);
  await fakeMedia(page);
  await fakePlays(page);
  const artist = new ArtistPage(page);
  const player = new PlayerBar(page);
  await artist.goto('kaiso-collective');

  await expect(artist.action('Follow')).toHaveAttribute('aria-pressed', 'false');
  await expect(artist.action('Share')).toBeVisible();
  await expect(artist.shelf('Popular')).toBeVisible();
  expect(await artist.titles(artist.popular)).toEqual(['Feathers Up', 'J’ouvert Morning']);
  const release = artist.shelf('Releases').getByRole('link', { name: /Mas on the Avenue/ });
  await expect(release).toContainText('2026 · 2 tracks');

  await artist.action('Play').click();
  await expect(player.title).toHaveText('Feathers Up');

  await release.click();
  await expect(page).toHaveURL('/albums/mas-on-the-avenue');
});

test('L2-010 AC3: an artist with no published tracks shows the empty state with Follow', async ({ page }) => {
  await fakeArtist(page, { detail: { ...KAISO_DETAIL, popular: [], releases: [] } });
  const artist = new ArtistPage(page);
  await artist.goto('kaiso-collective');

  await expect(artist.heading).toHaveText('Kaiso Collective');
  await expect(artist.empty.getByRole('heading', { name: 'No tracks released yet' })).toBeVisible();
  await expect(artist.empty).toContainText('Kaiso Collective hasn’t published anything. Follow to hear when they do.');
  await expect(artist.empty.getByRole('button', { name: 'Follow' })).toBeVisible();
  await expect(artist.shelf('Popular')).toHaveCount(0);
});

test('an unknown artist shows the Not found page', async ({ page }) => {
  await fakeArtist(page, { status: 404 });
  await new ArtistPage(page).goto('nobody');

  await expect(new NotFoundPage(page).heading).toHaveText('We couldn’t find that page');
});

test('L2-011 AC1: /albums/mas-on-the-avenue is headed with the title and the linked artist', async ({ page }) => {
  await fakeAlbum(page);
  await fakeArtist(page);
  const album = new AlbumPage(page);
  await album.goto('mas-on-the-avenue');

  await expect(album.heading).toHaveText('Mas on the Avenue');
  await expect(album.subtitle).toHaveText('Kaiso Collective · Album');
  await expect(page).toHaveTitle('Mas on the Avenue · Hummi');
  await album.subtitle.getByRole('link', { name: 'Kaiso Collective' }).click();
  await expect(page).toHaveURL('/artists/kaiso-collective');
});

test('L2-011 AC2: Play, Add to playlist, Share, the track list and the summary line', async ({ page }) => {
  await fakeAlbum(page);
  await fakeMedia(page);
  await fakePlays(page);
  const album = new AlbumPage(page);
  const player = new PlayerBar(page);
  await album.goto('mas-on-the-avenue');

  await expect(album.action('Add to playlist')).toBeVisible();
  await expect(album.action('Share')).toBeVisible();
  expect(await album.titles(album.list('Mas on the Avenue'))).toEqual(['Feathers Up', 'J’ouvert Morning']);
  await expect(album.summary).toHaveText('2026 · 2 tracks · 8 min · CC0 1.0 (public domain)');

  await album.action('Play').click();
  await expect(player.title).toHaveText('Feathers Up');
});

test('L2-011 AC3: an album that is not published is not found; there is no empty album page', async ({ page }) => {
  await fakeAlbum(page, { status: 404 });
  await new AlbumPage(page).goto('unreleased');

  await expect(new NotFoundPage(page).heading).toHaveText('We couldn’t find that page');
  await expect(page.locator('main .album-summary')).toHaveCount(0);
});

test('L2-012 AC1: the licence page heads "Licence and credit" with the credit alert', async ({ page }) => {
  await fakeTrack(page, { detail: PIXABAY_DETAIL });
  const licence = new LicencePage(page);
  await licence.goto('fixture-song');

  await expect(licence.heading).toHaveText('Licence and credit');
  await expect(licence.subtitle).toHaveText('How you can reuse what you hear on Hummi');
  await expect(licence.alert).toHaveClass(/alert--info/);
  await expect(licence.alert.locator('.alert__title')).toHaveText('Fixture Song is under the Pixabay Content License');
  await expect(page).toHaveTitle('Licence and credit · Hummi');
});

test('L2-012 AC4: a track whose model is known keeps the credit line naming it', async ({ page }) => {
  await fakeTrack(page, { detail: { ...FEATHERS_UP_DETAIL, licence: 'ccBy4', licenceLabel: 'CC BY 4.0' } });
  const licence = new LicencePage(page);
  await licence.goto('feathers-up');

  await expect(licence.alert.locator('.alert__title')).toHaveText('Feathers Up is CC BY 4.0');
  await expect(licence.alert).toContainText(
    'Credit is required: “Feathers Up by Kaiso Collective, generated with openmusic-3b.”',
  );
});

test('L2-012 AC2: the "Licences on Hummi" table lists the Pixabay Content License', async ({ page }) => {
  await fakeTrack(page, { detail: PIXABAY_DETAIL });
  const licence = new LicencePage(page);
  await licence.goto('fixture-song');

  await expect(licence.main.getByRole('heading', { name: 'Licences on Hummi', level: 2 })).toBeVisible();
  await expect(licence.table.locator('thead th')).toHaveText(['Licence', 'You may', 'You must']);
  expect(await licence.rows()).toEqual([
    [
      'Pixabay Content License',
      'Use, change and share for free, including commercially',
      'Nothing; credit is appreciated. Don’t sell or redistribute it unaltered on its own, or claim it as your own',
    ],
  ]);
});

test('L2-012 AC3: "Back to Feathers Up" returns to the track page', async ({ page }) => {
  await fakeTrack(page);
  const licence = new LicencePage(page);
  await licence.goto('feathers-up');

  await licence.main.getByRole('link', { name: 'Back to Feathers Up' }).click();

  await expect(page).toHaveURL('/tracks/feathers-up');
  await expect(licence.heading).toHaveText('Feathers Up');
});

test('L2-012 AC4: the licence page has no empty state; a missing track is not found', async ({ page }) => {
  await fakeTrack(page, { status: 404 });
  await new LicencePage(page).goto('no-such-track');

  await expect(new NotFoundPage(page).heading).toHaveText('We couldn’t find that page');
});

test('L2-044 AC1: an unknown route shows the Not found page with Go to Home and Search Hummi', async ({ page }) => {
  await page.goto('/no-such-page');
  const notFound = new NotFoundPage(page);

  await expect(notFound.code).toHaveText('404');
  await expect(notFound.heading).toHaveText('We couldn’t find that page');
  await expect(notFound.text).toHaveText(
    'The link may be old or mistyped. The track or playlist might also have been removed by its owner.',
  );
  await expect(notFound.action('Go to Home')).toBeVisible();
  await expect(notFound.action('Search Hummi')).toBeVisible();
});

import { expect, fakeArtist, fakeMedia, fakePlays, fakeTrack, test, WITHDRAWN_DETAIL } from '../fixtures';
import { NotFoundPage, TrackPage } from '../pages/catalogue.page';
import { PlayerBar } from '../pages/player.page';

test.use({ viewport: { width: 1280, height: 800 } });

test('L2-008 AC1: /tracks/feathers-up is headed with the title, the linked artist and album, and the overline', async ({
  page,
}) => {
  await fakeTrack(page);
  await fakeArtist(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  await expect(track.heading).toHaveText('Feathers Up');
  await expect(track.subtitle).toHaveText('Kaiso Collective · Mas on the Avenue');
  await expect(track.overline).toHaveText('Track · 3:42');
  await expect(page).toHaveTitle('Feathers Up · Hummi');

  await track.subtitle.getByRole('link', { name: 'Kaiso Collective' }).click();
  await expect(page).toHaveURL('/artists/kaiso-collective');
});

test('L2-008 AC2: the actions and a waveform showing the played proportion', async ({ page }) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  await expect(track.action('Play')).toBeVisible();
  await expect(track.action('Like Feathers Up')).toHaveAttribute('aria-pressed', 'false');
  await expect(track.action('Add to playlist')).toBeVisible();
  await expect(track.action('Share')).toBeVisible();
  await expect(track.action('Report this track')).toBeVisible();
  await expect(track.waveform).toHaveAttribute('aria-label', 'Waveform, not played');
  await expect(track.waveform.locator('span')).toHaveCount(64);
});

test('L2-008 AC2: Play starts the track and the waveform fills as it plays', async ({ page }) => {
  await fakeTrack(page);
  await fakeMedia(page);
  const plays = await fakePlays(page);
  const track = new TrackPage(page);
  const player = new PlayerBar(page);
  await track.goto('feathers-up');

  await track.action('Play').click();

  await expect(player.title).toHaveText('Feathers Up');
  await expect.poll(() => plays.posted.map((p) => p.trackId)).toEqual(['feathers-up']);
  await expect(track.waveform).toHaveAttribute('aria-label', /^Waveform, \d+% played$/, { timeout: 5000 });
  await expect(track.waveform.locator('span.is-played').first()).toBeVisible({ timeout: 5000 });
});

test('L2-008 AC3: the Details list names artist, album, genre, model, licence and plays', async ({ page }) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  await expect(track.main.getByRole('heading', { name: 'Details', level: 2 })).toBeVisible();
  await expect(track.details.locator('dt')).toHaveText([
    'Artist',
    'Album',
    'Genre',
    'Generated with',
    'Licence',
    'Plays',
  ]);
  await expect(track.detail('Artist').getByRole('link')).toHaveAttribute('href', '/artists/kaiso-collective');
  await expect(track.detail('Album').getByRole('link')).toHaveAttribute('href', '/albums/mas-on-the-avenue');
  await expect(track.detail('Genre')).toHaveText('Soca');
  await expect(track.detail('Generated with')).toHaveText('openmusic-3b (open weights)');
  await expect(track.detail('Licence').getByRole('link', { name: 'CC0 1.0 (public domain)' })).toHaveAttribute(
    'href',
    '/tracks/feathers-up/licence',
  );
  await expect(track.detail('Plays')).toHaveText('128,904');
});

test('L2-008 AC4: a "More from Kaiso Collective" shelf lists the artist’s other tracks', async ({ page }) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  const shelf = track.shelf('More from Kaiso Collective');
  await expect(shelf).toBeVisible();
  expect(await track.titles(shelf)).toEqual(['J’ouvert Morning']);
  await expect(track.shelf('Similar tracks')).toHaveCount(0);
});

test('L2-009 AC1: a withdrawn track shows the warning and cannot be played', async ({ page }) => {
  await fakeTrack(page, { detail: WITHDRAWN_DETAIL });
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  await expect(track.heading).toHaveText('Feathers Up');
  await expect(track.alert).toHaveClass(/alert--warning/);
  await expect(track.alert).toContainText('This track is no longer available');
  await expect(track.alert).toContainText(
    'Its creator withdrew it, so we can’t play it. It was licensed CC0 1.0 (public domain); copies already shared keep that licence.',
  );
  await expect(track.action('Play')).toHaveCount(0);
  await expect(track.waveform).toHaveCount(0);
});

test('L2-009 AC2: a withdrawn track lists playable Similar tracks', async ({ page }) => {
  await fakeTrack(page, { detail: WITHDRAWN_DETAIL });
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  const shelf = track.shelf('Similar tracks');
  await expect(shelf).toBeVisible();
  expect(await track.titles(shelf)).toEqual(['Road March Riddim', 'Panyard Nights']);
  await expect(track.shelf('More from Kaiso Collective')).toHaveCount(0);
});

test('L2-009 AC3 and L2-044 AC1: a track that does not exist shows the Not found page', async ({ page }) => {
  await fakeTrack(page, { status: 404 });
  const track = new TrackPage(page);
  await track.goto('no-such-track');

  const notFound = new NotFoundPage(page);
  await expect(notFound.code).toHaveText('404');
  await expect(notFound.heading).toHaveText('We couldn’t find that page');
  await expect(notFound.text).toHaveText(
    'The link may be old or mistyped. The track or playlist might also have been removed by its owner.',
  );
  await expect(notFound.action('Go to Home')).toHaveAttribute('href', '/');
  await expect(notFound.action('Search Hummi')).toBeVisible();
});

test('the track page shows a skeleton while loading and an error block with Try again when it fails', async ({
  page,
}) => {
  const failing = await fakeTrack(page, { status: 500 });
  const track = new TrackPage(page);
  await track.goto('feathers-up');

  await expect(track.main.getByRole('heading', { name: 'This track didn’t load' })).toBeVisible();
  await fakeTrack(page, { delayMs: 500 });
  await track.main.getByRole('button', { name: 'Try again' }).click();
  await expect(track.main.locator('[aria-busy="true"]')).toBeVisible();
  await expect(track.heading).toHaveText('Feathers Up');
  expect(failing.calls()).toBe(1);
});

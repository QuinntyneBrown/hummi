import {
  FEATHERS_UP_DETAIL,
  NADIA,
  ROAD_TRIP,
  SUNDAY_KITCHEN,
  TRACKS,
  expect,
  fakeHome,
  fakeLibrary,
  fakeMedia,
  fakePlays,
  fakePlaylists,
  fakeShares,
  fakeSignedInVisitor,
  fakeTrack,
  test,
} from '../fixtures';
import { TrackPage } from '../pages/catalogue.page';
import { LibraryPage, PlaylistPage } from '../pages/library.page';
import { PlayerBar } from '../pages/player.page';
import { ShareSheet, SharedTrackPage } from '../pages/sharing.page';

test.use({ viewport: { width: 1280, height: 800 } });

const WINE_SLOW_DETAIL = {
  ...FEATHERS_UP_DETAIL,
  id: 'wine-slow',
  slug: 'wine-slow',
  title: 'Wine Slow',
  durationSeconds: 176,
  artist: { slug: 'marisol-vega', name: 'Marisol Vega' },
  album: { slug: 'slow-wine', title: 'Slow Wine' },
  licence: 'ccBy4',
  licenceLabel: 'CC BY 4.0',
};

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
});

// ---------------------------------------------------------------- L2-025 Share dialog

test('L2-025 AC1: Share opens "Share {name}" with the cover, Link and Embed, the link, Copy and the send targets', async ({
  page,
}) => {
  const { shared } = await fakeShares(page);
  await fakeTrack(page);
  const track = new TrackPage(page);
  const sheet = new ShareSheet(page);
  await track.goto('feathers-up');

  await track.action('Share').click();

  await expect(sheet.dialog).toHaveAccessibleName('Share Feathers Up');
  await expect(sheet.dialog).toContainText('Free for anyone to play — no account needed.');
  await expect(sheet.tab('Link')).toHaveAttribute('aria-selected', 'true');
  await expect(sheet.tab('Embed')).toHaveAttribute('aria-selected', 'false');
  await expect(sheet.link).toHaveText(/^localhost:\d+\/s\/k7m2p9qa$/);
  await expect(sheet.copy).toHaveText('Copy');
  await expect(sheet.dialog).toContainText('Send it straight to');
  for (const name of ['WhatsApp', 'Email', 'Messages']) await expect(sheet.target(name)).toBeVisible();
  await expect(sheet.target('WhatsApp')).toHaveAttribute('href', /wa\.me.*k7m2p9qa/);
  await expect(sheet.start).toHaveCount(0);
  expect(shared).toEqual([{ type: 'track', id: TRACKS.feathersUp.id }]);
});

test('L2-025 AC2: Copy copies the link and reads "Copied" for a moment', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await fakeShares(page);
  await fakeTrack(page);
  const track = new TrackPage(page);
  const sheet = new ShareSheet(page);
  await track.goto('feathers-up');
  await track.action('Share').click();

  await sheet.copy.click();

  await expect(sheet.copy).toHaveText('Copied');
  await expect(sheet.status).toHaveText('Link copied.');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^http:\/\/localhost:\d+\/s\/k7m2p9qa$/);
  await expect(sheet.copy).toHaveText('Copy', { timeout: 4000 });
});

test('L2-025 AC3: the Embed tab shows the preview card and the iframe code with its own Copy', async ({ page }) => {
  await fakeShares(page);
  await fakeTrack(page);
  const track = new TrackPage(page);
  const sheet = new ShareSheet(page);
  await track.goto('feathers-up');
  await track.action('Share').click();

  await sheet.tab('Embed').click();

  await expect(sheet.dialog.locator('.embed-card')).toContainText('Feathers Up');
  await expect(sheet.dialog.locator('.embed-card')).toContainText('Kaiso Collective');
  await expect(sheet.code).toHaveText(
    '<iframe src="https://hummi.fm/embed/feathers-up" width="100%" height="96" frameborder="0"></iframe>',
  );
  await expect(sheet.copy).toHaveText('Copy');
});

test('L2-025 AC4: sharing the current track after it played offers "Start at {m:ss}" and adds the time', async ({
  page,
}) => {
  await fakeShares(page);
  await fakeTrack(page);
  await fakeMedia(page);
  await fakePlays(page);
  const track = new TrackPage(page);
  const sheet = new ShareSheet(page);
  const player = new PlayerBar(page);
  await track.goto('feathers-up');
  await track.action('Play').click();
  await expect(player.elapsed).not.toHaveText('0:00', { timeout: 10_000 });
  await player.pause.click();
  const elapsed = (await player.elapsed.textContent())!.trim();
  const [m, sec] = elapsed.split(':').map(Number);

  await track.action('Share').click();

  await expect(sheet.start).toBeVisible();
  await expect(sheet.dialog.locator('.share__start')).toHaveText(`Start at ${elapsed}`);
  await sheet.start.check();
  await expect(sheet.link).toHaveText(new RegExp(`/s/k7m2p9qa\\?t=${m * 60 + sec}$`));
});

test('L2-025 AC5: a shared playlist opens for someone else without change controls', async ({ page }) => {
  await fakeShares(page, { abcd2345: { type: 'playlist', playlistId: 'p1' } });
  await fakePlaylists(page, [{ ...ROAD_TRIP, isOwner: false, shareCode: 'abcd2345' }]);
  const playlist = new PlaylistPage(page);

  await page.goto('/s/abcd2345');

  await expect(page).toHaveURL(/\/playlists\/p1\?share=abcd2345$/);
  await expect(playlist.heading).toHaveText('Road trip to the north coast');
  await expect(playlist.titles()).toHaveCount(3);
  await expect(playlist.action('Rename')).toHaveCount(0);
  await expect(playlist.action('Delete')).toHaveCount(0);
  await expect(playlist.list.getByRole('checkbox')).toHaveCount(0);
});

// ---------------------------------------------------------------- L2-026 Shared track landing page

test('L2-026 AC1, AC2: a visitor opens a shared track and sees the landing page', async ({ page }) => {
  await fakeShares(page, { k7m2p9qa: { type: 'track', trackSlug: 'wine-slow' } });
  await fakeTrack(page, { detail: WINE_SLOW_DETAIL });
  const landing = new SharedTrackPage(page);

  await landing.goto('k7m2p9qa');

  await expect(landing.heading).toHaveText('Wine Slow');
  await expect(landing.overline).toHaveText('Shared with you');
  await expect(landing.meta).toHaveText('Marisol Vega · Slow Wine · 2:56 · CC BY 4.0');
  await expect(landing.action('Play preview')).toBeVisible();
  await expect(landing.action('Sign up to save it')).toBeVisible();
  await expect(landing.waveform).toBeVisible();
  await expect(landing.alert).toContainText('Free to listen, free to keep');
  await expect(landing.alert).toContainText(
    'Hummi is free. Create an account to save this track to a playlist, follow Marisol Vega and keep your place.',
  );
});

test('L2-026 AC3: Play preview plays without an account and Sign up to save it opens Sign up', async ({ page }) => {
  await fakeShares(page, { k7m2p9qa: { type: 'track', trackSlug: 'wine-slow' } });
  await fakeTrack(page, { detail: WINE_SLOW_DETAIL });
  await fakeMedia(page);
  await fakePlays(page);
  const landing = new SharedTrackPage(page);
  const player = new PlayerBar(page);
  await landing.goto('k7m2p9qa');

  await landing.action('Play preview').click();

  await expect(player.title).toHaveText('Wine Slow');
  await expect(player.pause).toBeVisible();
  await landing.action('Sign up to save it').click();
  await expect(page).toHaveURL(/\/sign-up$/);
});

test('L2-026 AC4: an incomplete link or a removed track shows "This link didn’t work"', async ({ page }) => {
  await fakeShares(page);
  const landing = new SharedTrackPage(page);

  await landing.goto('k7m2');

  await expect(page.getByRole('alert')).toContainText('This link didn’t work');
  await expect(page.getByRole('alert')).toContainText('The link may be incomplete or the track may have been removed.');
});

// ---------------------------------------------------------------- L2-024 Someone else's playlist

test('L2-024 AC1, AC2: Mei’s public playlist is read-only with Play, Save to my library and Share', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
  await fakePlaylists(page, [SUNDAY_KITCHEN]);
  const playlist = new PlaylistPage(page);

  await playlist.goto('p3');

  await expect(playlist.subtitle).toHaveText('3 tracks · by Mei Rodríguez · public');
  await expect(playlist.actions()).toHaveText(['Play', 'Save to my library', 'Share']);
  await expect(playlist.main.locator('.alert--info')).toContainText('This playlist belongs to Mei Rodríguez');
  await expect(playlist.main.locator('.alert--info')).toContainText(
    'You can listen and save a copy to your library. Only Mei can change the tracks.',
  );
  await expect(playlist.list.getByRole('checkbox')).toHaveCount(0);
});

test('L2-024 AC3: Save to my library adds the playlist to Library', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  let saved = false;
  await fakeLibrary(page, {
    body: () => ({
      playlistCount: saved ? 1 : 0,
      likedCount: 0,
      followingCount: 0,
      playlists: saved
        ? [{ id: 'p3', name: 'Sunday kitchen', trackCount: 3, ownerName: 'Mei Rodríguez', coverUrl: null }]
        : [],
      liked: [],
      following: [],
    }),
  });
  const fake = await fakePlaylists(page, [SUNDAY_KITCHEN]);
  const playlist = new PlaylistPage(page);
  await playlist.goto('p3');

  await playlist.action('Save to my library').click();
  saved = true;

  await expect(playlist.action('Saved to your library')).toHaveAttribute('aria-pressed', 'true');
  expect(fake.calls.some((c) => c.call === 'PUT /api/me/saved-playlists/p3')).toBe(true);
  const library = new LibraryPage(page);
  await library.goto();
  await expect(library.titles()).toHaveText(['Sunday kitchen']);
  await expect(library.panel.locator('.tile__meta')).toHaveText(['3 tracks · Mei Rodríguez']);
});

// ---------------------------------------------------------------- L2-045 Forbidden page

test('L2-024 AC4, L2-045: a private playlist without access shows the Forbidden page', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
  await fakePlaylists(page, [{ ...SUNDAY_KITCHEN, isPublic: false }]);
  const playlist = new PlaylistPage(page);

  await playlist.goto('p3');

  await expect(playlist.main.locator('.overline')).toHaveText('403');
  await expect(playlist.heading).toHaveText('You don’t have access to this');
  await expect(playlist.main).toContainText(
    'This playlist is private. Ask the owner to share it with you, or sign in with the account they invited.',
  );
  await expect(playlist.action('Go to Home')).toHaveAttribute('href', '/');
  await playlist.action('Switch account').click();
  await expect(page).toHaveURL(/\/sign-in\?returnUrl=%2Fplaylists%2Fp3$/);
});

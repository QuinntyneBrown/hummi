import {
  EMPTY_LIBRARY,
  FEATHERS_UP_DETAIL,
  LIBRARY,
  NADIA,
  ROAD_TRIP,
  TRACKS,
  expect,
  fakeAuth,
  fakeGenres,
  fakeHome,
  fakeLibrary,
  fakeMedia,
  fakePlays,
  fakePlaylists,
  fakeSignedInVisitor,
  fakeTrack,
  test,
} from '../fixtures';
import { AccountShell, SignInPage } from '../pages/accounts.page';
import { TrackPage } from '../pages/catalogue.page';
import { HomePage } from '../pages/home.page';
import { DialogPage, PlaylistPage } from '../pages/library.page';
import { PlayerBar } from '../pages/player.page';

test.use({ viewport: { width: 1280, height: 800 } });

async function fakeStatus(page: import('@playwright/test').Page, maintenance: string | null): Promise<void> {
  await page.route('**/api/status', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ maintenance }) }),
  );
}

// ---------------------------------------------------------------- L2-041 Toasts

test('L2-041 AC1: a toast is a pill in a polite live region above the player bar with the cover', async ({ page }) => {
  await fakeHome(page);
  await fakeMedia(page);
  await fakePlays(page);
  const home = new HomePage(page);
  await home.goto();
  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();
  await expect(new PlayerBar(page).region).toBeVisible();

  await home.row('Big Truck Energy').getByRole('button', { name: 'More actions for Big Truck Energy' }).click();
  await page.getByRole('menuitem', { name: 'Play next' }).click();

  const region = page.locator('.toast-region');
  await expect(region).toHaveAttribute('role', 'status');
  await expect(region).toHaveAttribute('aria-live', 'polite');
  await expect(region).not.toHaveClass(/toast-region--noplayer/);
  await expect(region.locator('.toast')).toContainText('“Big Truck Energy” will play next');
  await expect(region.locator('.toast .cover')).toHaveCount(1);
});

test('L2-041 AC3, AC4: Saved and Removed toasts offer Undo, which reverts the like', async ({ page }) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  const { writes } = await fakeLibrary(page, { body: EMPTY_LIBRARY });
  const home = new HomePage(page);
  await home.goto();
  await expect(new AccountShell(page).avatar).toBeVisible();

  await home.row('Feathers Up').getByRole('button', { name: 'More actions for Feathers Up' }).click();
  await page.getByRole('menuitem', { name: 'Save to library' }).click();

  const toast = page.locator('.toast').filter({ hasText: 'Saved “Feathers Up” to your library' });
  await expect(toast).toBeVisible();
  await expect(home.row('Feathers Up').getByRole('button', { name: 'Remove like from Feathers Up' })).toBeVisible();
  await toast.getByRole('button', { name: 'Undo' }).click();

  await expect(home.row('Feathers Up').getByRole('button', { name: 'Like Feathers Up' })).toBeVisible();
  expect(writes).toEqual([`PUT /api/me/likes/${TRACKS.feathersUp.id}`, `DELETE /api/me/likes/${TRACKS.feathersUp.id}`]);

  await home.row('Big Truck Energy').getByRole('button', { name: 'Like Big Truck Energy' }).click();
  await home.row('Big Truck Energy').getByRole('button', { name: 'More actions for Big Truck Energy' }).click();
  await page.getByRole('menuitem', { name: 'Remove from library' }).click();
  await expect(
    page.locator('.toast').filter({ hasText: 'Removed “Big Truck Energy” from your library' }),
  ).toBeVisible();
});

test('L2-041 AC4: Add to queue and Add to library on the billboard show their toasts', async ({ page }) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
  const home = new HomePage(page);
  await home.goto();
  await expect(new AccountShell(page).avatar).toBeVisible();

  await home.row('Feathers Up').getByRole('button', { name: 'More actions for Feathers Up' }).click();
  await page.getByRole('menuitem', { name: 'Add to queue' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Added “Feathers Up” to your queue' })).toBeVisible();

  await page.getByRole('region', { name: 'Featured' }).getByRole('button', { name: 'Add to library' }).click();
  await expect(page.locator('.toast').filter({ hasText: 'Added Mas on the Avenue to your library' })).toBeVisible();
});

// ---------------------------------------------------------------- L2-042 Banners

test('L2-042 AC1, AC2: scheduled maintenance shows a status banner with its window and Dismiss', async ({ page }) => {
  await fakeStatus(page, 'Sunday 1 Nov, 02:00 to 02:30 UTC');
  await fakeGenres(page);
  await page.goto('/browse');

  const banner = page.locator('.banner').filter({ hasText: 'Scheduled maintenance' });
  await expect(banner).toHaveText(
    /Scheduled maintenance\.\s*Hummi will be read-only on Sunday 1 Nov, 02:00 to 02:30 UTC\. Playback keeps working\./,
  );
  await expect(banner).toHaveAttribute('role', 'status');
  await expect(banner.locator('svg.icon').first()).toBeVisible();

  await banner.getByRole('button', { name: 'Dismiss' }).click();
  await expect(banner).toHaveCount(0);
});

test('L2-042 AC3: losing the connection shows You’re offline; regaining it shows You’re back online', async ({
  page,
  context,
}) => {
  await fakeGenres(page);
  await page.goto('/browse');
  await expect(page.getByRole('heading', { name: 'Browse', level: 1 })).toBeVisible();

  await context.setOffline(true);
  await expect(page.locator('.banner')).toHaveText(
    /You’re offline\.\s*Showing saved tracks\. Reconnect to stream anything new\./,
  );

  await context.setOffline(false);
  await expect(page.locator('.banner')).toHaveText(/You’re back online\.\s*Your queue and likes are up to date\./);
});

test('L2-042 AC4: an unreachable streaming service shows the danger banner as an alert', async ({ page }) => {
  await fakeHome(page);
  await fakeMedia(page, { dropConnection: true });
  await fakePlays(page);
  const home = new HomePage(page);
  await home.goto();

  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();

  const banner = page.locator('.banner.alert--danger');
  await expect(banner).toHaveText(
    /Playback can’t start\.\s*We can’t reach the streaming service right now\. We’re on it\./,
  );
  await expect(banner).toHaveAttribute('role', 'alert');
});

test('L2-042 AC5: the email-confirmation banner stays, without Dismiss, until the email is confirmed', async ({
  page,
}) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, { ...NADIA, emailConfirmed: false });
  await fakeLibrary(page, { body: LIBRARY });
  await new HomePage(page).goto();

  const banner = page.locator('.banner').filter({ hasText: 'Confirm your email' });
  await expect(banner).toBeVisible();
  await expect(banner.getByRole('button', { name: 'Dismiss' })).toHaveCount(0);
  await page.getByRole('banner').getByRole('link', { name: 'Your library' }).click();
  await expect(banner).toBeVisible();
});

// ---------------------------------------------------------------- L2-044, L2-046 Error pages

test('L2-044 AC1: a removed playlist shows the Not found page', async ({ page }) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
  await fakePlaylists(page, [ROAD_TRIP]);

  await new PlaylistPage(page).goto('gone');

  await expect(page.locator('main .overline')).toHaveText('404');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('We couldn’t find that page');
  await expect(page.locator('main')).toContainText(
    'The link may be old or mistyped. The track or playlist might also have been removed by its owner.',
  );
  await expect(page.getByRole('link', { name: 'Go to Home' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Search Hummi' })).toBeVisible();
});

test('L2-046 AC1, AC2: a page that cannot render shows Server error and is recorded', async ({ page }) => {
  const recorded: unknown[] = [];
  await page.route('**/api/client-errors', (route) => {
    recorded.push(route.request().postDataJSON());
    return route.fulfill({ status: 204, body: '' });
  });
  await fakeTrack(page, { detail: { ...FEATHERS_UP_DETAIL, artist: null } });

  await new TrackPage(page).goto('feathers-up');

  await expect(page.locator('main .overline')).toHaveText('500');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Something broke on our side');
  await expect(page.locator('main')).toContainText(
    'We’ve been told and we’re fixing it. Nothing you saved is lost; try again in a minute.',
  );
  await expect(page).toHaveURL(/\/tracks\/feathers-up$/);
  await expect(page.getByRole('link', { name: 'Go to Home' })).toHaveAttribute('href', '/');
  await expect.poll(() => recorded.length).toBeGreaterThan(0);
  expect(recorded[0]).toMatchObject({ path: '/tracks/feathers-up' });

  await page.unroute('**/api/tracks/**');
  await fakeTrack(page);
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('heading', { name: 'Feathers Up', level: 1 })).toBeVisible();
});

// ---------------------------------------------------------------- L2-047 Dialog behaviour

test('L2-047 AC1, AC2: a dialog is modal, labelled and described, with the page inert; Escape closes it', async ({
  page,
}) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
  const account = new AccountShell(page);
  await new HomePage(page).goto();
  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Sign out' }).click();

  await expect(account.dialog).toHaveAttribute('aria-modal', 'true');
  await expect(account.dialog).toHaveAccessibleName('Sign out of Hummi?');
  await expect(account.dialog).toHaveAccessibleDescription(
    'Your playlists and likes stay saved. You can keep listening without an account.',
  );
  expect(await page.locator('main#main').evaluate((el) => (el as HTMLElement).inert)).toBe(true);

  await page.keyboard.press('Escape');
  await expect(account.dialog).toHaveCount(0);
  expect(await page.locator('main#main').evaluate((el) => (el as HTMLElement).inert)).toBe(false);
});

test('L2-047 AC1, AC2: a page’s own dialog makes the page inert and Close closes it without saving', async ({
  page,
}) => {
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
  const fake = await fakePlaylists(page, [ROAD_TRIP]);
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');

  await playlist.action('Rename').click();
  await dialog.field('Playlist name').fill('Something new');

  expect(await playlist.list.evaluate((el) => !!el.closest('[inert]'))).toBe(true);
  expect(await page.getByRole('banner').evaluate((el) => !!el.closest('[inert]'))).toBe(true);
  await dialog.button('Close').click();
  await expect(dialog.dialog).toHaveCount(0);
  expect(await playlist.list.evaluate((el) => !!el.closest('[inert]'))).toBe(false);
  expect(fake.calls.some((c) => c.call.startsWith('PUT'))).toBe(false);
});

test('L2-047 AC3: while a dialog is busy, Cancel is disabled and Escape does not close it', async ({ page }) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
  await fakeAuth(page, { 'sign-out': { status: 204, delayMs: 2000 } });
  const account = new AccountShell(page);
  await new HomePage(page).goto();
  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Sign out' }).click();

  await account.dialogButton('Sign out').click();

  await expect(account.dialog.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(account.dialog).toBeVisible();
});

// ---------------------------------------------------------------- L2-048 Keyboard-accessible forms

test('L2-048 AC2: a form with errors focuses the summary, links each item to its field and marks the fields', async ({
  page,
}) => {
  await fakeAuth(page);
  const signIn = new SignInPage(page);
  await signIn.goto();

  await signIn.submit();

  await expect(signIn.summary).toBeFocused();
  await expect(signIn.summary).toContainText('Fix 2 things to continue');
  await expect(signIn.field('Email')).toHaveAttribute('aria-invalid', 'true');
  await expect(signIn.field('Email')).toHaveAttribute('aria-describedby', /email-err/);
  await signIn.summary.getByRole('link', { name: 'Enter your password' }).click();
  await expect(signIn.field('Password')).toBeFocused();
});

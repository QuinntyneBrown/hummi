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
  fakeSettings,
  fakeSignedInVisitor,
  test,
} from '../fixtures';
import { AccountShell } from '../pages/accounts.page';
import { HomePage } from '../pages/home.page';
import { PlayerBar } from '../pages/player.page';
import { SettingsPage, logoColours } from '../pages/settings.page';

test.use({ viewport: { width: 1280, height: 900 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
});

// ---------------------------------------------------------------- L2-033 Settings profile

test('L2-033 AC1, AC5: Settings shows the name and email, the Profile fields, Save changes and Sign out', async ({
  page,
}) => {
  await fakeSettings(page);
  const settings = new SettingsPage(page);

  await settings.goto();

  await expect(settings.heading).toHaveText('Settings');
  await expect(settings.subtitle).toHaveText('Nadia Charles · nadia@hummi.fm');
  await expect(settings.section('Profile')).toBeVisible();
  await expect(settings.field('Display name')).toHaveValue('Nadia Charles');
  await expect(settings.field('Display name')).toHaveAttribute('required', '');
  await expect(settings.field('Email')).toHaveValue('nadia@hummi.fm');
  await expect(settings.section('Profile')).toContainText('We use this for sign-in and account emails only.');
  await expect(settings.button('Save changes')).toBeVisible();
  await settings.button('Sign out').click();
  await expect(new AccountShell(page).dialog).toHaveAccessibleName('Sign out of Hummi?');
});

test('L2-033 AC2: an empty display name shows the summary and the field error and saves nothing', async ({ page }) => {
  const { saved } = await fakeSettings(page);
  const settings = new SettingsPage(page);
  await settings.goto();

  await settings.field('Display name').fill('');
  await settings.button('Save changes').click();

  await expect(settings.summary).toContainText('Display name can’t be empty');
  await expect(settings.fieldError('Display name')).toHaveText('Display name can’t be empty');
  expect(saved).toEqual([]);
});

test('L2-033 AC3: while saving, the fields are read-only and the button reads "Saving…"', async ({ page }) => {
  await fakeSettings(page, { delayMs: 1500 });
  const settings = new SettingsPage(page);
  await settings.goto();

  await settings.button('Save changes').click();

  await expect(settings.button('Saving…')).toBeDisabled();
  await expect(settings.field('Display name')).toHaveAttribute('readonly', '');
  await expect(settings.field('Email')).toHaveAttribute('readonly', '');
});

test('L2-033 AC4: a save shows "Settings saved" and another device reads the change', async ({ page, context }) => {
  const fake = await fakeSettings(page);
  const settings = new SettingsPage(page);
  await settings.goto();

  await settings.field('Display name').fill('Nadia C');
  await settings.button('Save changes').click();

  await expect(settings.alert).toContainText('Settings saved');
  await expect(settings.alert).toContainText('Your changes apply on every device you’re signed in on.');
  expect(fake.current().displayName).toBe('Nadia C');

  const other = await context.newPage();
  await other.route('**/api/me/settings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fake.current()) }),
  );
  await fakeHome(other);
  await fakeSignedInVisitor(other, NADIA);
  await fakeLibrary(other, { body: EMPTY_LIBRARY });
  await new SettingsPage(other).goto();
  await expect(new SettingsPage(other).field('Display name')).toHaveValue('Nadia C');
});

// ---------------------------------------------------------------- L2-034 Playback preferences

test('L2-034 AC1: Playback shows Autoplay similar tracks on and Crossfade off', async ({ page }) => {
  await fakeSettings(page);
  const settings = new SettingsPage(page);

  await settings.goto();

  await expect(settings.section('Playback')).toBeVisible();
  await expect(settings.switch('Autoplay similar tracks')).toBeChecked();
  await expect(settings.section('Playback')).toContainText('Keep playing when your queue ends.');
  await expect(settings.switch('Crossfade')).not.toBeChecked();
  await expect(settings.section('Playback')).toContainText('Blend the end of one track into the next.');
});

const SHORT = { [TRACKS.bigTruck.id]: 9, [TRACKS.redLight.id]: 9, [TRACKS.feathersUp.id]: 2, [TRACKS.longTitle.id]: 2 };

for (const autoplay of [true, false]) {
  test(`L2-034 AC2: with Autoplay ${autoplay ? 'on similar tracks keep playing' : 'off playback stops'} when the queue ends`, async ({
    page,
  }) => {
    await fakeSettings(page, { start: { autoplaySimilar: autoplay } });
    await fakeMedia(page, { seconds: SHORT });
    await fakePlays(page);
    const { sorts } = await fakeGenreTracks(page);
    const home = new HomePage(page);
    const player = new PlayerBar(page);
    await home.goto();
    await expect(page.getByRole('button', { name: /^Account: / })).toBeVisible();

    await home
      .row(TRACKS.longTitle.title)
      .getByRole('button', { name: `Play ${TRACKS.longTitle.title}` })
      .click();

    if (autoplay) {
      await expect(player.title).toHaveText('Panyard Nights', { timeout: 10_000 });
      expect(sorts).toContain('most-played');
    } else {
      await expect(player.play).toBeVisible({ timeout: 10_000 });
      await expect(player.title).toHaveText(TRACKS.longTitle.title);
      expect(sorts).toEqual([]);
    }
  });
}

test('L2-034 AC3: with Crossfade on, the next track starts before the current one ends', async ({ page }) => {
  await fakeSettings(page, { start: { crossfade: true } });
  await fakeMedia(page, { seconds: SHORT });
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await expect(page.getByRole('button', { name: /^Account: / })).toBeVisible();

  await home.row('Big Truck Energy').getByRole('button', { name: 'Play Big Truck Energy' }).click();
  await expect(player.pause).toBeVisible();
  const started = Date.now();

  // 9 seconds long with a 6-second crossfade: Red Light Riddim takes over about 3 seconds in.
  await expect(player.title).toHaveText('Red Light Riddim', { timeout: 8000 });
  expect(Date.now() - started).toBeLessThan(7500);
});

test('L2-034 AC3: with Crossfade off, tracks do not overlap', async ({ page }) => {
  await fakeSettings(page);
  await fakeMedia(page, { seconds: SHORT });
  await fakePlays(page);
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await expect(page.getByRole('button', { name: /^Account: / })).toBeVisible();

  await home.row('Big Truck Energy').getByRole('button', { name: 'Play Big Truck Energy' }).click();
  await expect(player.pause).toBeVisible();
  await page.waitForTimeout(5000);

  await expect(player.title).toHaveText('Big Truck Energy');
});

// ---------------------------------------------------------------- L2-035 Notification preferences

test('L2-035 AC1: Notifications shows New tracks from artists I follow on and Product news off', async ({ page }) => {
  const fake = await fakeSettings(page);
  const settings = new SettingsPage(page);
  await settings.goto();

  await expect(settings.switch('New tracks from artists I follow')).toBeChecked();
  await expect(settings.section('Notifications')).toContainText('At most one email a week.');
  await expect(settings.switch('Product news')).not.toBeChecked();
  await expect(settings.section('Notifications')).toContainText('Rare, and never about other people’s data.');

  await settings.switch('New tracks from artists I follow').uncheck();
  await settings.switch('Product news').check();
  await settings.button('Save changes').click();

  await expect(settings.alert).toContainText('Settings saved');
  expect(fake.current()).toMatchObject({ notifyNewReleases: false, productNews: true });
});

// ---------------------------------------------------------------- L2-049 Light and dark themes

test('L2-049 AC1: Appearance offers Match my device (default), Light and Dark', async ({ page }) => {
  await fakeSettings(page);
  const settings = new SettingsPage(page);

  await settings.goto();

  await expect(settings.section('Appearance').getByRole('group', { name: 'Theme' })).toBeVisible();
  await expect(settings.theme('Match my device')).toBeChecked();
  await expect(settings.theme('Light')).not.toBeChecked();
  await expect(settings.theme('Dark')).not.toBeChecked();
});

test('L2-049 AC2, AC4: Match my device follows the colour scheme and shows the matching wordmark', async ({ page }) => {
  await fakeSettings(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await new HomePage(page).goto();
  const canvas = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const dark = await canvas();

  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  const inDark = await logoColours(page);
  expect(inDark.stroke).not.toBe(inDark.coral);

  await page.emulateMedia({ colorScheme: 'light' });

  await expect.poll(canvas).not.toBe(dark);
  const inLight = await logoColours(page);
  expect(inLight.stroke).toBe(inLight.coral);
});

test('L2-049 AC3: Light or Dark, once saved, wins over the device and applies on the next visit', async ({ page }) => {
  const fake = await fakeSettings(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  const settings = new SettingsPage(page);
  await settings.goto();

  await settings.theme('Light').check();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  const light = await logoColours(page);
  expect(light.stroke).toBe(light.coral);
  await settings.button('Save changes').click();
  await expect(settings.alert).toContainText('Settings saved');
  expect(fake.current().theme).toBe('light');

  await new HomePage(page).goto();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  await settings.goto();
  await settings.theme('Dark').check();
  await settings.button('Save changes').click();
  await page.emulateMedia({ colorScheme: 'light' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const dark = await logoColours(page);
  expect(dark.stroke).not.toBe(dark.coral);
});

// ---------------------------------------------------------------- L2-052 Account menu destinations

test('L2-052 AC5: Settings and Your library in the account menu open their pages', async ({ page }) => {
  await fakeSettings(page);
  const account = new AccountShell(page);
  await new HomePage(page).goto();

  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Settings' }).click();
  await expect(page).toHaveURL(/\/settings$/);

  await account.avatar.click();
  await account.menu.getByRole('menuitem', { name: 'Your library' }).click();
  await expect(page).toHaveURL(/\/library$/);
});

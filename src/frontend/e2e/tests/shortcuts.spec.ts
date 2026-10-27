import { expect, fakeGenreTracks, fakeHome, fakeMedia, fakePlays, fakeSearch, test } from '../fixtures';
import { HomePage } from '../pages/home.page';
import { PlayerBar } from '../pages/player.page';
import { QueueDrawer } from '../pages/queue.page';
import { SearchLayer } from '../pages/search.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakePlays(page);
  await fakeMedia(page);
  await fakeGenreTracks(page);
  await fakeSearch(page);
});

/** Plays the Top 10 from Big Truck Energy, then moves focus off the play button onto the page. */
async function playAndBlur(page: import('@playwright/test').Page): Promise<void> {
  const home = new HomePage(page);
  await home.goto();
  await home.row('Big Truck Energy').getByRole('button', { name: 'Play Big Truck Energy' }).click();
  await expect(new PlayerBar(page).pause).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

test('L2-017 AC1: Space toggles between play and pause', async ({ page }) => {
  const player = new PlayerBar(page);
  await playAndBlur(page);

  await page.keyboard.press('Space');
  await expect(player.play).toBeVisible();

  await page.keyboard.press('Space');
  await expect(player.pause).toBeVisible();
});

test('L2-017 AC1 with L2-048: Space on a focused button activates that button instead of toggling playback', async ({
  page,
}) => {
  const player = new PlayerBar(page);
  await playAndBlur(page);
  await player.next.focus();

  await page.keyboard.press('Space');

  await expect(player.title).toHaveText('Red Light Riddim');
  await expect(player.pause).toBeVisible();
});

test('L2-017 AC2: → plays the next track and ← the previous one', async ({ page }) => {
  const player = new PlayerBar(page);
  await playAndBlur(page);

  await page.keyboard.press('ArrowRight');
  await expect(player.title).toHaveText('Red Light Riddim');

  await page.keyboard.press('ArrowLeft');
  await expect(player.title).toHaveText('Big Truck Energy');
});

test('L2-017 AC3: Q opens the queue, / opens search and ? opens Keyboard shortcuts', async ({ page }) => {
  const queue = new QueueDrawer(page);
  const search = new SearchLayer(page);
  await playAndBlur(page);

  await page.keyboard.press('q');
  await expect(queue.drawer).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(queue.drawer).toHaveCount(0);

  await page.keyboard.press('/');
  await expect(search.dialog).toBeVisible();
  await expect(search.field).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(search.dialog).toHaveCount(0);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toBeVisible();
});

test('L2-017 AC3: L with no like flow yet leaves playback alone (likes arrive with journey 09)', async ({ page }) => {
  const player = new PlayerBar(page);
  await playAndBlur(page);

  await page.keyboard.press('l');

  await expect(player.pause).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('L2-017 AC4: with a text field focused the keys type into it and no shortcut fires', async ({ page }) => {
  const player = new PlayerBar(page);
  const queue = new QueueDrawer(page);
  const search = new SearchLayer(page);
  await playAndBlur(page);
  await search.open();
  await expect(search.field).toBeFocused();

  await page.keyboard.type('q l? /');
  await page.keyboard.press('ArrowRight');

  await expect(search.field).toHaveValue('q l? /');
  await expect(queue.drawer).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Keyboard shortcuts' })).toHaveCount(0);
  await expect(player.title).toHaveText('Big Truck Energy');
  await expect(player.pause).toBeVisible();
});

test('L2-017 AC5: the Keyboard shortcuts dialog lists the six shortcuts and closes with Close or Escape', async ({
  page,
}) => {
  await playAndBlur(page);
  const dialog = page.getByRole('dialog', { name: 'Keyboard shortcuts' });

  await page.keyboard.press('?');

  await expect(dialog).toHaveAttribute('aria-modal', 'true');
  await expect(dialog).toHaveAccessibleDescription('Work while the page is focused and no text field is.');
  await expect(dialog.locator('dt')).toHaveText(['Space', '→ / ←', 'L', 'Q', '/', '?']);
  await expect(dialog.locator('dd')).toHaveText([
    'Play or pause',
    'Next or previous track',
    'Like the current track',
    'Open the queue',
    'Focus search',
    'Show this list',
  ]);
  await expect(page.locator('main')).toHaveAttribute('inert', '');
  await dialog.getByRole('button', { name: 'Close' }).last().click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator('main')).not.toHaveAttribute('inert', '');

  await page.keyboard.press('?');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

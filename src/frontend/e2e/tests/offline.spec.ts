import type { Page } from '@playwright/test';

import { KAISO_DETAIL, expect, fakeArtist, fakeHome, fakeMedia, fakePlays, fakeTrack, test } from '../fixtures';
import { TrackPage } from '../pages/catalogue.page';
import { HomePage } from '../pages/home.page';
import { PlayerBar } from '../pages/player.page';

test.use({ viewport: { width: 1280, height: 800 } });

/** Navigates inside the running app, as a link would, so nothing is fetched from the network for the page itself. */
async function goInApp(page: Page, url: string): Promise<void> {
  await page.evaluate((to) => {
    history.pushState({}, '', to);
    dispatchEvent(new PopStateEvent('popstate', { state: {} }));
  }, url);
}

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakeMedia(page);
  await fakePlays(page);
});

test('L2-043 AC1: offline, a page visited before shows its saved content with the offline banner', async ({
  page,
  context,
}) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');
  await expect(track.heading).toHaveText('Feathers Up');
  await goInApp(page, '/');
  await expect(new HomePage(page).topTen).toBeVisible();

  await context.setOffline(true);
  await goInApp(page, '/tracks/feathers-up');

  await expect(track.heading).toHaveText('Feathers Up');
  await expect(page.locator('.banner')).toContainText('You’re offline');
  await context.setOffline(false);
});

test('L2-043 AC2: offline, a track saved on the device plays; another says it needs a connection', async ({
  page,
  context,
}) => {
  const home = new HomePage(page);
  const player = new PlayerBar(page);
  await home.goto();
  await home.row('Feathers Up').getByRole('button', { name: 'Play Feathers Up' }).click();
  await expect(player.pause).toBeVisible();
  await expect(
    page.locator('.toast').filter({ hasText: 'Downloads are saved for offline listening on this device' }),
  ).toBeVisible();
  await player.pause.click();

  await context.setOffline(true);
  await goInApp(page, '/saved');
  const saved = page.getByRole('list', { name: 'Saved on this device' });
  await expect(saved.locator('.track__title')).toHaveText(['Feathers Up']);
  await saved.getByRole('button', { name: 'Play Feathers Up' }).click();
  await expect(player.pause).toBeVisible();
  await expect(player.title).toHaveText('Feathers Up');

  await goInApp(page, '/');
  await home.row('Red Light Riddim').getByRole('button', { name: 'Play Red Light Riddim' }).click();
  await expect(
    page.locator('.toast').filter({ hasText: '“Red Light Riddim” needs a connection to play' }),
  ).toBeVisible();
  await expect(player.play).toBeVisible();
  await context.setOffline(false);
});

test('L2-043 AC3: offline, a page never visited shows the Offline page with Retry and Open saved tracks', async ({
  page,
  context,
}) => {
  await fakeArtist(page);
  await new HomePage(page).goto();
  await expect(new HomePage(page).topTen).toBeVisible();

  await context.setOffline(true);
  await goInApp(page, '/artists/kaiso-collective');

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('You’re offline');
  await expect(page.locator('main')).toContainText(
    'Hummi can’t reach the network. Tracks you saved on this device still play; everything else will load when you’re back.',
  );
  await expect(page).toHaveURL(/\/artists\/kaiso-collective$/);
  await expect(page.getByRole('link', { name: 'Open saved tracks' })).toHaveAttribute('href', '/saved');

  await context.setOffline(false);
  await page.getByRole('button', { name: 'Retry' }).click();
  await expect(page.getByRole('heading', { name: KAISO_DETAIL.name, level: 1 })).toBeVisible();
});

test('L2-043 AC4: no download option is offered for a track anywhere', async ({ page }) => {
  await fakeTrack(page);
  const track = new TrackPage(page);
  const player = new PlayerBar(page);
  const download = /download/i;
  await track.goto('feathers-up');
  await track.action('Play').click();
  await expect(player.pause).toBeVisible();

  await expect(page.getByRole('button', { name: download })).toHaveCount(0);
  await expect(page.getByRole('link', { name: download })).toHaveCount(0);
  await player.region.getByRole('button', { name: 'More actions' }).click();
  await expect(page.getByRole('menu')).toBeVisible();
  await expect(page.getByRole('menuitem', { name: download })).toHaveCount(0);
});

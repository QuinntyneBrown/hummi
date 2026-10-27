import {
  LIBRARY,
  NADIA,
  RAINY_DAY,
  ROAD_TRIP,
  TRACKS,
  expect,
  fakeHome,
  fakeLibrary,
  fakePlaylists,
  fakeSignedInVisitor,
  fakeTrack,
  test,
} from '../fixtures';
import { TrackPage } from '../pages/catalogue.page';
import { DialogPage, LibraryPage, PlaylistPage } from '../pages/library.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page);
});

async function openAddToPlaylist(page: import('@playwright/test').Page): Promise<DialogPage> {
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');
  await track.action('Add to playlist').click();
  return new DialogPage(page);
}

// ---------------------------------------------------------------- L2-021 Create and rename a playlist

test('L2-021 AC1, AC2: New playlist shows the form and creates a private playlist', async ({ page }) => {
  const fake = await fakePlaylists(page);
  const library = new LibraryPage(page);
  const dialog = new DialogPage(page);
  await library.goto();

  await library.action('New playlist').click();

  await expect(dialog.dialog).toHaveAccessibleName('New playlist');
  await expect(dialog.dialog).toHaveAccessibleDescription('Playlists are private until you share them.');
  await expect(dialog.field('Playlist name')).toHaveAttribute('required', '');
  await expect(dialog.dialog.getByText('Up to 60 characters')).toBeVisible();
  const make = dialog.dialog.getByRole('checkbox', { name: /^Make it public/ });
  await expect(make).not.toBeChecked();
  await expect(dialog.dialog).toContainText('Anyone can find and listen to it. You can change this later.');
  await expect(dialog.button('Cancel')).toBeVisible();

  await dialog.field('Playlist name').fill('Rainy Sunday');
  await dialog.button('Create playlist').click();

  await expect(dialog.dialog).toHaveCount(0);
  expect(fake.calls.find((c) => c.call === 'POST /api/playlists')?.body).toEqual({
    name: 'Rainy Sunday',
    isPublic: false,
    trackIds: [],
  });
});

test('L2-021 AC2: Make it public creates a public playlist', async ({ page }) => {
  const fake = await fakePlaylists(page);
  const dialog = new DialogPage(page);
  await new LibraryPage(page).goto();
  await new LibraryPage(page).action('New playlist').click();

  await dialog.field('Playlist name').fill('Panorama night');
  await dialog.dialog.getByRole('checkbox', { name: /^Make it public/ }).check();
  await dialog.button('Create playlist').click();

  await expect(dialog.dialog).toHaveCount(0);
  expect(fake.playlists[0]).toMatchObject({ name: 'Panorama night', isPublic: true });
});

test('L2-021 AC3, AC4: an empty or too long name shows the error and creates nothing', async ({ page }) => {
  const fake = await fakePlaylists(page);
  const dialog = new DialogPage(page);
  await new LibraryPage(page).goto();
  await new LibraryPage(page).action('New playlist').click();

  await dialog.button('Create playlist').click();
  await expect(dialog.dialog.locator('.field__error')).toHaveText('Give your playlist a name');
  await expect(dialog.field('Playlist name')).toHaveAttribute('aria-invalid', 'true');

  await dialog.field('Playlist name').fill('x'.repeat(61));
  await dialog.button('Create playlist').click();
  await expect(dialog.dialog.locator('.field__error')).toHaveText('Use up to 60 characters');

  expect(fake.calls.filter((c) => c.call === 'POST /api/playlists')).toEqual([]);
});

test('L2-021 AC5: Rename opens "Rename playlist" prefilled and saves with Save name', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP]);
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');

  await playlist.action('Rename').click();

  await expect(dialog.dialog).toHaveAccessibleName('Rename playlist');
  await expect(dialog.dialog).toHaveAccessibleDescription('Choose a new name for this playlist.');
  await expect(dialog.field('Playlist name')).toHaveValue('Road trip to the north coast');
  await dialog.field('Playlist name').fill('North coast');
  await dialog.button('Save name').click();

  await expect(dialog.dialog).toHaveCount(0);
  await expect(playlist.heading).toHaveText('North coast');
  expect(fake.calls.find((c) => c.call === 'PUT /api/playlists/p1')?.body).toEqual({
    name: 'North coast',
    isPublic: false,
  });
});

test('L2-021 AC6: while saving, the name is read-only and the button reads "Saving…"', async ({ page }) => {
  await fakePlaylists(page);
  await page.route('**/api/playlists', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ status: 201, contentType: 'application/json', body: '{"id":"x","name":"x","position":0}' });
  });
  const dialog = new DialogPage(page);
  await new LibraryPage(page).goto();
  await new LibraryPage(page).action('New playlist').click();
  await dialog.field('Playlist name').fill('Rainy Sunday');

  await dialog.button('Create playlist').click();

  await expect(dialog.button('Saving…')).toBeDisabled();
  await expect(dialog.field('Playlist name')).toHaveAttribute('readonly', '');
  await expect(dialog.dialog.getByRole('checkbox', { name: /^Make it public/ })).toBeDisabled();
  await expect(dialog.button('Cancel')).toBeDisabled();
});

test('L2-021 AC7: a failed save shows "That didn’t work" and keeps the name', async ({ page }) => {
  await fakePlaylists(page, [], { create: 500 });
  const dialog = new DialogPage(page);
  await new LibraryPage(page).goto();
  await new LibraryPage(page).action('New playlist').click();
  await dialog.field('Playlist name').fill('Rainy Sunday');

  await dialog.button('Create playlist').click();

  await expect(dialog.dialog.getByRole('alert')).toContainText('That didn’t work');
  await expect(dialog.dialog.getByRole('alert')).toContainText(
    'The playlist wasn’t saved. Your name is still here; try again.',
  );
  await expect(dialog.field('Playlist name')).toHaveValue('Rainy Sunday');
});

// ---------------------------------------------------------------- L2-020 Add to playlist

test('L2-020 AC1: Add to playlist lists the playlists with counts, the ones holding the track checked', async ({
  page,
}) => {
  await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY]);

  const dialog = await openAddToPlaylist(page);

  await expect(dialog.dialog).toHaveAccessibleName('Add “Feathers Up” to a playlist');
  await expect(dialog.dialog).toHaveAccessibleDescription('Pick one or more. You can change this later.');
  await expect(dialog.choice('Road trip to the north coast')).toBeChecked();
  await expect(dialog.choice('Rainy-day panyard')).not.toBeChecked();
  await expect(dialog.dialog).toContainText('3 tracks');
  await expect(dialog.dialog).toContainText('1 track');
  await expect(dialog.button('New playlist')).toBeVisible();
  await expect(dialog.button('Cancel')).toBeVisible();
  await expect(dialog.button('Save')).toBeVisible();
});

test('L2-020 AC2: Save adds to checked and removes from unchecked, with the success toast and Undo', async ({
  page,
}) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY]);
  const dialog = await openAddToPlaylist(page);

  await dialog.choice('Road trip to the north coast').uncheck();
  await dialog.choice('Rainy-day panyard').check();
  await dialog.button('Save').click();

  await expect(dialog.dialog).toHaveCount(0);
  const toast = page.locator('.toast--success');
  await expect(toast).toContainText('Added to Rainy-day panyard');
  await expect(toast).toContainText('“Feathers Up” is now track 2.');
  expect(fake.calls.find((c) => c.call === 'PUT /api/me/playlist-membership')?.body).toEqual({
    trackId: TRACKS.feathersUp.id,
    playlistIds: ['p2'],
  });

  await toast.getByRole('button', { name: 'Undo' }).click();

  await expect.poll(() => fake.playlists[0].tracks.some((t) => t.id === TRACKS.feathersUp.id)).toBe(true);
  expect(fake.playlists[1].tracks.map((t) => t.id)).toEqual([TRACKS.panyard.id]);
});

test('L2-020 AC3: while saving, the choices and Cancel are disabled and the button reads "Saving…"', async ({
  page,
}) => {
  await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY]);
  await page.route('**/api/me/playlist-membership', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"added":[],"removed":[]}' });
  });
  const dialog = await openAddToPlaylist(page);
  await dialog.choice('Rainy-day panyard').check();

  await dialog.button('Save').click();

  await expect(dialog.button('Saving…')).toBeDisabled();
  await expect(dialog.button('Cancel')).toBeDisabled();
  await expect(dialog.choice('Rainy-day panyard')).toBeDisabled();
});

test('L2-020 AC4: a failed save shows "That didn’t work" and changes nothing', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY], { membership: 500 });
  const dialog = await openAddToPlaylist(page);
  await dialog.choice('Rainy-day panyard').check();

  await dialog.button('Save').click();

  await expect(dialog.dialog.getByRole('alert')).toContainText('That didn’t work');
  await expect(dialog.dialog.getByRole('alert')).toContainText(
    'We couldn’t save your changes. Nothing was added; try again.',
  );
  expect(fake.playlists[1].tracks).toHaveLength(1);
});

test('L2-020 AC5: with no playlists, the dialog offers Create playlist and the new one holds the track', async ({
  page,
}) => {
  const fake = await fakePlaylists(page);
  const dialog = await openAddToPlaylist(page);

  await expect(dialog.dialog).toHaveAccessibleName('Add to playlist');
  await expect(dialog.dialog).toHaveAccessibleDescription('You don’t have a playlist yet.');
  await expect(dialog.dialog.getByRole('heading', { name: 'No playlists' })).toBeVisible();
  await expect(dialog.dialog).toContainText('Create one and “Feathers Up” goes in it.');
  await expect(dialog.button('Cancel')).toBeVisible();

  await dialog.button('Create playlist').click();
  await dialog.field('Playlist name').fill('Soca mornings');
  await dialog.button('Create playlist').click();

  await expect(page.locator('.toast--success')).toContainText('Added to Soca mornings');
  expect(fake.playlists[0].tracks.map((t) => t.id)).toEqual([TRACKS.feathersUp.id]);
});

test('L2-020 AC6: adding a selected track already in the chosen playlist asks "Add it again?"', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY]);
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');
  await playlist.select('Panyard Nights').check();
  await playlist.action('Add to another playlist').click();

  await dialog.choice('Rainy-day panyard').check();
  await dialog.button('Save').click();

  const toast = page.locator('.toast--warning');
  await expect(toast).toContainText('Already in this playlist');
  await expect(toast).toContainText('“Panyard Nights” is in Rainy-day panyard. Add it again?');

  await toast.getByRole('button', { name: 'Add again' }).click();

  await expect.poll(() => fake.playlists[1].tracks.length).toBe(2);
});

test('L2-020 AC7: a dropped connection shows "Couldn’t add the track" with Retry', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY], { membership: 0 });
  const dialog = await openAddToPlaylist(page);
  await dialog.choice('Rainy-day panyard').check();

  await dialog.button('Save').click();

  const toast = page.getByRole('alert').filter({ hasText: 'Couldn’t add the track' });
  await expect(toast).toContainText('The connection dropped before we could save. Nothing was added.');
  expect(fake.playlists[1].tracks).toHaveLength(1);

  delete fake.failures.membership;
  await toast.getByRole('button', { name: 'Retry' }).click();

  await expect.poll(() => fake.playlists[1].tracks.length).toBe(2);
});

// ---------------------------------------------------------------- L2-023 Own playlist page and multi-select

test('L2-023 AC1: the owner sees count, length and visibility with Play, Share, Rename and Delete', async ({
  page,
}) => {
  await fakePlaylists(page, [ROAD_TRIP]);
  const playlist = new PlaylistPage(page);

  await playlist.goto('p1');

  await expect(playlist.heading).toHaveText('Road trip to the north coast');
  await expect(playlist.subtitle).toHaveText('3 tracks · 14 min · private');
  await expect(playlist.actions()).toHaveText(['Play', 'Share', 'Rename', 'Delete']);
  await expect(playlist.titles()).toHaveText(['J’ouvert Morning', 'Feathers Up', 'Panyard Nights']);
});

test('L2-023 AC2: an empty playlist shows "Nothing here yet", Browse genres and only Share', async ({ page }) => {
  await fakePlaylists(page, [{ ...ROAD_TRIP, tracks: [] }]);
  const playlist = new PlaylistPage(page);

  await playlist.goto('p1');

  await expect(playlist.empty.getByRole('heading')).toHaveText('Nothing here yet');
  await expect(playlist.empty).toContainText('Add tracks from anywhere with Add to playlist, or start from a genre.');
  await expect(playlist.action('Browse genres')).toHaveAttribute('href', '/browse');
  await expect(playlist.actions()).toHaveText(['Share']);
});

test('L2-023 AC3, AC4: selecting two tracks shows the bar; Remove from playlist removes them', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP]);
  const playlist = new PlaylistPage(page);
  await playlist.goto('p1');

  await playlist.select('J’ouvert Morning').check();
  await playlist.select('Panyard Nights').check();

  await expect(playlist.selectionBar).toContainText('2 tracks selected');
  await expect(playlist.action('Add to another playlist')).toBeVisible();
  await playlist.action('Remove from playlist').click();

  await expect(playlist.titles()).toHaveText(['Feathers Up']);
  await expect(playlist.selectionBar).toHaveCount(0);
  expect(fake.calls.find((c) => c.call === 'POST /api/playlists/p1/entries/remove')?.body).toEqual({
    entryIds: ['p1-e0', 'p1-e2'],
  });
});

test('L2-023 AC4: Add to another playlist opens Add to playlist for the selected tracks', async ({ page }) => {
  await fakePlaylists(page, [ROAD_TRIP, RAINY_DAY]);
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');
  await playlist.select('J’ouvert Morning').check();
  await playlist.select('Feathers Up').check();

  await playlist.action('Add to another playlist').click();

  await expect(dialog.dialog).toHaveAccessibleName('Add 2 tracks to a playlist');
  await expect(dialog.choice('Rainy-day panyard')).not.toBeChecked();
});

// ---------------------------------------------------------------- L2-022 Delete a playlist

test('L2-022 AC1, AC2: Delete asks to type the name; Delete playlist stays disabled until it matches', async ({
  page,
}) => {
  await fakePlaylists(page, [ROAD_TRIP]);
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');

  await playlist.action('Delete').click();

  await expect(dialog.dialog).toHaveAccessibleName('Delete “Road trip to the north coast”?');
  await expect(dialog.dialog).toHaveAccessibleDescription(
    'You can’t undo this. People you shared it with lose access.',
  );
  await expect(dialog.dialog).toContainText('This deletes 3 tracks from the playlist, not from Hummi.');
  await expect(dialog.button('Delete playlist')).toBeDisabled();
  await dialog.field('Type the playlist name to confirm').fill('Road trip');
  await expect(dialog.button('Delete playlist')).toBeDisabled();
  await dialog.field('Type the playlist name to confirm').fill('Road trip to the north coast');
  await expect(dialog.button('Delete playlist')).toBeEnabled();
});

test('L2-022 AC3: deleting removes the playlist and opens Library', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP]);
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');
  await playlist.action('Delete').click();
  await dialog.field('Type the playlist name to confirm').fill('Road trip to the north coast');

  await dialog.button('Delete playlist').click();

  await expect(page).toHaveURL(/\/library$/);
  expect(fake.playlists).toEqual([]);
  expect(fake.calls.some((c) => c.call === 'DELETE /api/playlists/p1')).toBe(true);
});

test('L2-022 AC4: while deleting, the field is read-only, Cancel disabled and the button reads "Deleting…"', async ({
  page,
}) => {
  await fakePlaylists(page, [ROAD_TRIP]);
  await page.route('**/api/playlists/p1', async (route) => {
    if (route.request().method() !== 'DELETE') return route.fallback();
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ status: 204, body: '' });
  });
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');
  await playlist.action('Delete').click();
  await dialog.field('Type the playlist name to confirm').fill('Road trip to the north coast');

  await dialog.button('Delete playlist').click();

  await expect(dialog.button('Deleting…')).toBeDisabled();
  await expect(dialog.button('Cancel')).toBeDisabled();
  await expect(dialog.field('Type the playlist name to confirm')).toHaveAttribute('readonly', '');
});

test('L2-022 AC5: a failed delete shows "That didn’t work" and the playlist stays', async ({ page }) => {
  const fake = await fakePlaylists(page, [ROAD_TRIP], { delete: 500 });
  const playlist = new PlaylistPage(page);
  const dialog = new DialogPage(page);
  await playlist.goto('p1');
  await playlist.action('Delete').click();
  await dialog.field('Type the playlist name to confirm').fill('Road trip to the north coast');

  await dialog.button('Delete playlist').click();

  await expect(dialog.dialog.getByRole('alert')).toContainText('That didn’t work');
  await expect(dialog.dialog.getByRole('alert')).toContainText(
    'The playlist wasn’t deleted. Try again, or reload the page.',
  );
  expect(fake.playlists).toHaveLength(1);
});

test('L2-019 AC2: Library shows the playlist tiles and they open the playlist', async ({ page }) => {
  await fakePlaylists(page, [ROAD_TRIP]);
  const library = new LibraryPage(page);
  await library.goto();

  await expect(library.titles()).toHaveText(LIBRARY.playlists.map((p) => p.name));
  await library.panel.getByRole('link', { name: /Road trip to the north coast/ }).click();

  await expect(page).toHaveURL(/\/playlists\/p1$/);
  await expect(new PlaylistPage(page).heading).toHaveText('Road trip to the north coast');
});

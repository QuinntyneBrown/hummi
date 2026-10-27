import {
  EMPTY_LIBRARY,
  NADIA,
  expect,
  fakeHome,
  fakeLibrary,
  fakeNotifications,
  fakeSignedInVisitor,
  test,
} from '../fixtures';
import { HomePage } from '../pages/home.page';
import { NotificationsPage } from '../pages/notifications.page';

test.use({ viewport: { width: 1280, height: 800 } });

test.beforeEach(async ({ page }) => {
  await fakeHome(page);
  await fakeSignedInVisitor(page, NADIA);
  await fakeLibrary(page, { body: EMPTY_LIBRARY });
});

// ---------------------------------------------------------------- L2-036 Notification list

test('L2-036 AC1, AC2: each kind shows its icon, linked text and a relative or dated time', async ({ page }) => {
  await fakeNotifications(page);
  const notifications = new NotificationsPage(page);

  await notifications.goto();

  await expect(notifications.heading).toHaveText('Notifications');
  await expect(notifications.items).toHaveCount(4);
  await expect(notifications.items.locator('svg.icon').first()).toBeVisible();
  await expect(notifications.items.nth(0)).toContainText('Kaiso Collective released Road March Riddim.');
  await expect(notifications.items.nth(0).getByRole('link', { name: 'Kaiso Collective' })).toHaveAttribute(
    'href',
    '/artists/kaiso-collective',
  );
  await expect(notifications.items.nth(0)).toContainText('2 hours ago');
  await expect(notifications.items.nth(1)).toContainText('Mei Rodríguez shared the playlist Sunday kitchen with you.');
  await expect(notifications.items.nth(1)).toContainText('Yesterday');
  await expect(notifications.items.nth(1).getByRole('link', { name: 'Sunday kitchen' })).toHaveAttribute(
    'href',
    '/playlists/p3?share=abcd2345',
  );
  await expect(notifications.items.nth(2)).toContainText('Tidewater Waltz passed 25,000 plays.');
  await expect(notifications.items.nth(2)).toContainText('Sat 24 Oct');
  await expect(notifications.items.nth(3)).toContainText('Hummi now shows the model that generated each track.');
  await expect(notifications.items.nth(3)).toContainText('Mon 19 Oct');
});

test('L2-036 AC3: with no notifications the page shows "You’re all caught up" and Find artists to follow', async ({
  page,
}) => {
  await fakeNotifications(page, []);
  const notifications = new NotificationsPage(page);

  await notifications.goto();

  await expect(notifications.empty.getByRole('heading')).toHaveText('You’re all caught up');
  await expect(notifications.empty).toContainText(
    'New releases from artists you follow and playlist shares show up here.',
  );
  await notifications.empty.getByRole('link', { name: 'Find artists to follow' }).click();
  await expect(page).toHaveURL(/\/browse$/);
});

// ---------------------------------------------------------------- L2-037 Unread notifications

test('L2-037 AC1: the header bell shows the unread badge and its label on every shell page', async ({ page }) => {
  await fakeNotifications(page);
  const notifications = new NotificationsPage(page);

  await new HomePage(page).goto();

  await expect(notifications.bell).toHaveAccessibleName('Notifications, 3 unread');
  await expect(notifications.bell.locator('.badge--count')).toHaveText('3');
  await expect(notifications.bell.locator('.badge--count')).toHaveAttribute('aria-label', '3 unread');
});

test('L2-037 AC2: the page shows "3 unread", a dot on each unread item and Mark all as read', async ({ page }) => {
  await fakeNotifications(page);
  const notifications = new NotificationsPage(page);

  await notifications.goto();

  await expect(notifications.subtitle).toHaveText('3 unread');
  await expect(notifications.main.getByRole('img', { name: 'Unread' })).toHaveCount(3);
  await expect(notifications.items.nth(3).getByRole('img', { name: 'Unread' })).toHaveCount(0);
  await expect(notifications.markAll).toBeVisible();
});

test('L2-037 AC3: Mark all as read clears the dots, the subtitle, the badge and hides the button', async ({ page }) => {
  const fake = await fakeNotifications(page);
  const notifications = new NotificationsPage(page);
  await notifications.goto();

  await notifications.markAll.click();

  await expect(notifications.main.getByRole('img', { name: 'Unread' })).toHaveCount(0);
  await expect(notifications.subtitle).toHaveCount(0);
  await expect(notifications.markAll).toHaveCount(0);
  await expect(notifications.bell).toHaveAccessibleName('Notifications');
  await expect(notifications.bell.locator('.badge--count')).toHaveCount(0);
  expect(fake.markedAll()).toBe(1);
});

test('L2-037: a visitor sees no bell', async ({ page }) => {
  await page.unroute('**/api/auth/me');
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 401, contentType: 'application/problem+json', body: '{"code":"UNAUTHENTICATED"}' }),
  );
  await new HomePage(page).goto();

  await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  await expect(new NotificationsPage(page).bell).toHaveCount(0);
});

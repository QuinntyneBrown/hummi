import {
  EMPTY_LIBRARY,
  NADIA,
  TRACKS,
  expect,
  fakeHome,
  fakeLibrary,
  fakeSignedInVisitor,
  fakeTrack,
  test,
} from '../fixtures';
import { AccountShell } from '../pages/accounts.page';
import { TrackPage } from '../pages/catalogue.page';
import { DialogPage } from '../pages/library.page';

test.use({ viewport: { width: 1280, height: 800 } });

const REASONS = [
  'Copied from an artist without permission',
  'Wrong licence',
  'Harmful or hateful content',
  'Something else',
];

/** POST /api/tracks/{id}/reports answers status after delayMs and keeps each body. */
async function fakeReports(
  page: import('@playwright/test').Page,
  options: { status?: number; delayMs?: number } = {},
): Promise<unknown[]> {
  const sent: unknown[] = [];
  await page.route(/\/api\/tracks\/[^/]+\/reports$/, async (route) => {
    sent.push(route.request().postDataJSON());
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    const status = options.status ?? 201;
    await route.fulfill(
      status === 201
        ? { status, contentType: 'application/json', body: '{"id":"r1"}' }
        : { status, contentType: 'application/problem+json', body: '{"title":"Server error","code":"UNEXPECTED"}' },
    );
  });
  return sent;
}

async function openReport(page: import('@playwright/test').Page): Promise<DialogPage> {
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto('feathers-up');
  await expect(new AccountShell(page).avatar).toBeVisible();
  await track.action('Report this track').click();
  return new DialogPage(page);
}

test.describe('signed in', () => {
  test.beforeEach(async ({ page }) => {
    await fakeHome(page);
    await fakeSignedInVisitor(page, NADIA);
    await fakeLibrary(page, { body: EMPTY_LIBRARY });
  });

  test('L2-038 AC1: Report this track opens "Report “{title}”" with the reasons, Details, Cancel and Send report', async ({
    page,
  }) => {
    await fakeReports(page);

    const dialog = await openReport(page);

    await expect(dialog.dialog).toHaveAccessibleName('Report “Feathers Up”');
    await expect(dialog.dialog).toHaveAccessibleDescription(
      'Tell us what’s wrong. The artist isn’t told who reported.',
    );
    await expect(dialog.dialog.getByRole('group', { name: 'What’s wrong?' }).getByRole('radio')).toHaveCount(4);
    for (const reason of REASONS) await expect(dialog.dialog.getByRole('radio', { name: reason })).not.toBeChecked();
    await expect(dialog.field('Details (optional)')).toBeVisible();
    await expect(dialog.button('Cancel')).toBeVisible();
    await expect(dialog.button('Send report')).toBeVisible();
  });

  test('L2-038 AC2: without a reason the choice shows "Choose a reason" and nothing is sent', async ({ page }) => {
    const sent = await fakeReports(page);
    const dialog = await openReport(page);

    await dialog.button('Send report').click();

    await expect(dialog.dialog.locator('.field__error')).toHaveText('Choose a reason');
    await expect(dialog.dialog.getByRole('radio', { name: REASONS[0] })).toHaveAttribute('aria-invalid', 'true');
    expect(sent).toEqual([]);
  });

  test('L2-038 AC3: while sending, the choices and Cancel are disabled, Details read-only, "Sending…"', async ({
    page,
  }) => {
    await fakeReports(page, { delayMs: 1500 });
    const dialog = await openReport(page);
    await dialog.dialog.getByRole('radio', { name: 'Wrong licence' }).check();

    await dialog.button('Send report').click();

    await expect(dialog.button('Sending…')).toBeDisabled();
    await expect(dialog.button('Cancel')).toBeDisabled();
    await expect(dialog.dialog.getByRole('radio', { name: 'Wrong licence' })).toBeDisabled();
    await expect(dialog.field('Details (optional)')).toHaveAttribute('readonly', '');
  });

  test('L2-038 AC4: a sent report thanks the listener and Close ends the dialog', async ({ page }) => {
    const sent = await fakeReports(page);
    const dialog = await openReport(page);
    await dialog.dialog.getByRole('radio', { name: REASONS[0] }).check();
    await dialog.field('Details (optional)').fill('It sounds like a known song.');

    await dialog.button('Send report').click();

    await expect(dialog.dialog).toHaveAccessibleName('Thanks, we’ll take a look');
    await expect(dialog.dialog).toHaveAccessibleDescription(
      'Reports are reviewed within 2 working days. We’ll email you the outcome.',
    );
    expect(sent).toEqual([{ reason: 'copied', details: 'It sounds like a known song.' }]);
    await dialog.dialog.locator('.dialog__footer').getByRole('button', { name: 'Close' }).click();
    await expect(dialog.dialog).toHaveCount(0);
  });

  test('L2-038 AC5: the report sends no identity of the reporter', async ({ page }) => {
    const sent = await fakeReports(page);
    const dialog = await openReport(page);
    await dialog.dialog.getByRole('radio', { name: 'Something else' }).check();

    await dialog.button('Send report').click();

    await expect(dialog.dialog).toHaveAccessibleName('Thanks, we’ll take a look');
    expect(JSON.stringify(sent)).not.toContain(NADIA.email);
    expect(JSON.stringify(sent)).not.toContain(NADIA.displayName);
  });

  test('L2-038 AC6: a failure shows "That didn’t work" and keeps the answers', async ({ page }) => {
    await fakeReports(page, { status: 500 });
    const dialog = await openReport(page);
    await dialog.dialog.getByRole('radio', { name: 'Harmful or hateful content' }).check();
    await dialog.field('Details (optional)').fill('Hateful lyrics at 1:20.');

    await dialog.button('Send report').click();

    await expect(dialog.dialog.getByRole('alert')).toContainText('That didn’t work');
    await expect(dialog.dialog.getByRole('alert')).toContainText(
      'Your report wasn’t sent. Your answers are still here; try again.',
    );
    await expect(dialog.dialog.getByRole('radio', { name: 'Harmful or hateful content' })).toBeChecked();
    await expect(dialog.field('Details (optional)')).toHaveValue('Hateful lyrics at 1:20.');
  });
});

test('Reporting signed out opens the sign-in prompt instead', async ({ page }) => {
  await fakeHome(page);
  await fakeTrack(page);
  const track = new TrackPage(page);
  await track.goto(TRACKS.feathersUp.slug);

  await track.action('Report this track').click();

  await expect(new AccountShell(page).dialog).toHaveAccessibleName('Sign in to save this');
});

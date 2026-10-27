import { expect, test } from '../fixtures';
import { ShellPage } from '../pages/shell.page';

test('an /api call with no fake is refused, never served by a real backend', async ({ page }) => {
  await new ShellPage(page).goto();

  const status = await page.evaluate(async () => (await fetch('/api/no-fake-for-this')).status);

  expect(status).toBe(501);
});

test('a /media call with no fake is refused, never served by a real backend', async ({ page }) => {
  await new ShellPage(page).goto();

  const status = await page.evaluate(async () => (await fetch('/media/no-fake-for-this.mp3')).status);

  expect(status).toBe(501);
});

test('the signed-out visitor fake answers GET /api/auth/me with 401', async ({ page }) => {
  await new ShellPage(page).goto();

  const status = await page.evaluate(async () => (await fetch('/api/auth/me')).status);

  expect(status).toBe(401);
});

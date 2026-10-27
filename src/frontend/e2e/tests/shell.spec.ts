import { expect, test } from '../fixtures';
import { ShellPage } from '../pages/shell.page';

test('the shell renders the brand and the home page', async ({ page }) => {
  const shell = new ShellPage(page);
  await shell.goto();

  await expect(shell.brand).toBeVisible();
  await expect(shell.brand.locator('hm-logo svg')).toBeVisible();
  await expect(shell.main.getByRole('heading', { name: 'Home', level: 1 })).toBeAttached();
});

test('the favicon is the coral tile', async ({ page }) => {
  const shell = new ShellPage(page);
  await shell.goto();

  await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', 'favicon.svg');
  const icon = await page.request.get('/favicon.svg');
  expect(icon.ok()).toBe(true);
  expect(await icon.text()).toContain('#F0533A');
});

test('an unknown route shows the not-found page', async ({ page }) => {
  const shell = new ShellPage(page);
  await shell.goto('/no-such-page');

  await expect(shell.main.getByRole('heading', { name: 'We couldn’t find that page' })).toBeVisible();
});

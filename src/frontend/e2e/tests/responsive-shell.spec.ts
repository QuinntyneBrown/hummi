import { expect, fakeSignedInVisitor, test } from '../fixtures';
import { ShellPage } from '../pages/shell.page';

const LINKS = ['Home', 'Soca', 'Kids', 'Steelpan', 'Your library'];

test.describe('wide viewport', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('L2-050 AC1: the links sit beside the logo and Home is the current page (L2-048 AC3)', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.goto();

    await expect(shell.brand).toBeVisible();
    for (const name of LINKS) await expect(shell.navLink(name)).toBeVisible();
    await expect(shell.navToggle).toBeHidden();
    await expect(shell.navLink('Home')).toHaveAttribute('aria-current', 'page');
    await expect(shell.navLink('Soca')).not.toHaveAttribute('aria-current', 'page');
  });
});

test.describe('narrow viewport', () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test('L2-050 AC2: the links hide behind Open navigation, whose expanded state follows them', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.goto();

    await expect(shell.navLink('Home')).toBeHidden();
    await expect(shell.navToggle).toHaveAttribute('aria-expanded', 'false');

    await shell.navToggle.click();
    await expect(shell.navToggle).toHaveAttribute('aria-expanded', 'true');
    for (const name of LINKS) await expect(shell.navLink(name)).toBeVisible();

    await shell.navToggle.click();
    await expect(shell.navToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(shell.navLink('Home')).toBeHidden();
  });

  test('L2-050 AC2: following a link closes the open navigation', async ({ page }) => {
    const shell = new ShellPage(page);
    await shell.goto();

    await shell.navToggle.click();
    await shell.navLink('Soca').click();

    await expect(shell.navToggle).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('smallest phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('L2-051 AC4: the wordmark and Open navigation keep their size beside Sign in and Sign up (L2-050 AC3)', async ({
    page,
  }) => {
    const shell = new ShellPage(page);
    await shell.goto();

    await expect(shell.signIn).toBeVisible();
    await expect(shell.signUp).toBeVisible();
    // A crowded header used to shrink the flex row: the wordmark scaled down to a few pixels and the
    // menu button collapsed. Both keep their full size and the page still does not scroll sideways.
    const wordmark = await shell.brand.locator('svg').boundingBox();
    expect(wordmark?.height).toBeGreaterThanOrEqual(28);
    expect(wordmark?.width).toBeGreaterThanOrEqual(90);
    const toggle = await shell.navToggle.boundingBox();
    expect(toggle?.width).toBeGreaterThanOrEqual(36);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  });
});

test('L2-048 AC1: the first Tab shows Skip to content, which moves focus to the main content', async ({ page }) => {
  const shell = new ShellPage(page);
  await shell.goto();

  await page.keyboard.press('Tab');
  await expect(shell.skipLink).toBeFocused();
  await expect(shell.skipLink).toBeInViewport();

  await page.keyboard.press('Enter');
  await expect(shell.main).toBeFocused();
});

test('L2-014 AC2: a signed-out visitor sees Sign in and Sign up instead of the bell and avatar', async ({ page }) => {
  const shell = new ShellPage(page);
  await shell.goto();

  await expect(shell.signIn).toBeVisible();
  await expect(shell.signUp).toBeVisible();
  await expect(page.getByRole('link', { name: /^Notifications/ })).toHaveCount(0);
  await expect(page.getByRole('banner').getByText('Nadia Charles')).toHaveCount(0);
});

test('L2-014 AC2: a signed-in listener does not see Sign in or Sign up', async ({ page }) => {
  await fakeSignedInVisitor(page, { displayName: 'Nadia Charles', email: 'nadia@example.com' });
  const shell = new ShellPage(page);
  await shell.goto();

  await expect(page.getByRole('banner').getByLabel('Account: Nadia Charles')).toBeVisible();
  await expect(shell.signIn).toHaveCount(0);
  await expect(shell.signUp).toHaveCount(0);
});

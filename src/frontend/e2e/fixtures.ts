import { test as base, expect, type Page } from '@playwright/test';

/**
 * Tests never reach a real backend: every /api call is answered by a fake registered with page.route.
 * By default a visitor is signed out, so GET /api/auth/me answers 401.
 */
export async function fakeSignedOutVisitor(page: Page): Promise<void> {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/problem+json',
      body: JSON.stringify({ title: 'Sign in to continue', code: 'UNAUTHENTICATED' }),
    }),
  );
}

export const test = base.extend<{ visitor: void }>({
  visitor: [
    async ({ page }, use) => {
      await fakeSignedOutVisitor(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect };

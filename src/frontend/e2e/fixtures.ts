import { test as base, expect, type Page } from '@playwright/test';

/**
 * Tests never reach a real backend: every /api and /media call is answered by a fake registered with page.route.
 * A call no test has faked answers 501, so a missing fake shows up as a failure instead of falling
 * through to the static server. Routes registered later take precedence, so tests override it freely.
 */
export async function refuseUnfakedCalls(page: Page): Promise<void> {
  for (const pattern of ['**/api/**', '**/media/**']) {
    await page.route(pattern, (route) =>
      route.fulfill({
        status: 501,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: `No fake for ${route.request().method()} ${route.request().url()}`,
          code: 'NO_FAKE',
        }),
      }),
    );
  }
}

/** By default a visitor is signed out, so GET /api/auth/me answers 401. */
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
      await refuseUnfakedCalls(page);
      await fakeSignedOutVisitor(page);
      await use();
    },
    { auto: true },
  ],
});

export { expect };

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

/** A signed-in listener: GET /api/auth/me answers 200 with this user. Registered later, so it wins. */
export async function fakeSignedInVisitor(page: Page, user: { displayName: string; email: string }): Promise<void> {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(user) }),
  );
}

export interface FakeTrack {
  id: string;
  title: string;
  artistName: string;
  durationSeconds: number;
  coverUrl: string | null;
  liked: boolean;
}

const track = (id: string, title: string, artistName: string, durationSeconds: number, liked = false): FakeTrack => ({
  id,
  title,
  artistName,
  durationSeconds,
  coverUrl: null,
  liked,
});

/** The demo catalogue, as Hummi.Cli seed writes it. */
export const TRACKS = {
  feathersUp: track('feathers-up', 'Feathers Up', 'Kaiso Collective', 222),
  bigTruck: track('big-truck-energy', 'Big Truck Energy', 'Lady Tamboo', 201),
  panyard: track('panyard-nights', 'Panyard Nights', 'Laventille Steel Orchestra', 400),
  redLight: track('red-light-riddim', 'Red Light Riddim', 'Shanique', 182, true),
  longTitle: track(
    'a-very-long-title',
    'The Quiet Between Two Lighthouses, Revisited (Extended Dream Mix)',
    'Panorama Players',
    439,
  ),
};

export const HOME = {
  recentlyAdded: [TRACKS.feathersUp, TRACKS.bigTruck, TRACKS.panyard],
  topTen: [TRACKS.bigTruck, TRACKS.redLight, TRACKS.feathersUp, TRACKS.longTitle],
};

/** Answers GET /api/home; returns how many times it was asked. */
export async function fakeHome(
  page: Page,
  options: { status?: number; delayMs?: number; body?: unknown } = {},
): Promise<{ calls: () => number }> {
  let calls = 0;
  await page.route('**/api/home', async (route) => {
    calls++;
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    const status = options.status ?? 200;
    await route.fulfill(
      status === 200
        ? { status, contentType: 'application/json', body: JSON.stringify(options.body ?? HOME) }
        : {
            status,
            contentType: 'application/problem+json',
            body: JSON.stringify({ title: 'Server error', code: 'UNEXPECTED' }),
          },
    );
  });
  return { calls: () => calls };
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

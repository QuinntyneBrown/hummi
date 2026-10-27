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

/** A quiet 8 kHz, 8-bit mono WAV of the given length, so the browser really plays something. */
function wav(seconds: number): Buffer {
  const rate = 8000;
  const samples = rate * seconds;
  const out = Buffer.alloc(44 + samples);
  out.write('RIFF', 0);
  out.writeUInt32LE(36 + samples, 4);
  out.write('WAVEfmt ', 8);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(rate, 24);
  out.writeUInt32LE(rate, 28);
  out.writeUInt16LE(1, 32);
  out.writeUInt16LE(8, 34);
  out.write('data', 36);
  out.writeUInt32LE(samples, 40);
  for (let n = 0; n < samples; n++) out[44 + n] = 128 + Math.round(20 * Math.sin((2 * Math.PI * 330 * n) / rate));
  return out;
}

/**
 * Answers GET /media/tracks/{id} with a WAV as long as the track, honouring byte ranges.
 * With dropConnection, every request fails as if the network went away.
 */
export async function fakeMedia(
  page: Page,
  options: { dropConnection?: boolean } = {},
): Promise<{ requested: string[] }> {
  const requested: string[] = [];
  const durations = new Map(Object.values(TRACKS).map((t) => [t.id, t.durationSeconds]));
  await page.route('**/media/tracks/*', async (route) => {
    const id = decodeURIComponent(new URL(route.request().url()).pathname.split('/').pop() ?? '');
    requested.push(id);
    if (options.dropConnection) return route.abort('internetdisconnected');
    const body = wav(durations.get(id) ?? 30);
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()['range'] ?? '');
    if (!range)
      return route.fulfill({ status: 200, contentType: 'audio/wav', headers: { 'Accept-Ranges': 'bytes' }, body });
    const start = Number(range[1]);
    const end = range[2] ? Math.min(Number(range[2]), body.length - 1) : body.length - 1;
    return route.fulfill({
      status: 206,
      contentType: 'audio/wav',
      headers: { 'Accept-Ranges': 'bytes', 'Content-Range': `bytes ${start}-${end}/${body.length}` },
      body: body.subarray(start, end + 1),
    });
  });
  return { requested };
}

/** Answers POST /api/plays with 204 and keeps each posted body. */
export async function fakePlays(page: Page): Promise<{ posted: { trackId: string }[] }> {
  const posted: { trackId: string }[] = [];
  await page.route('**/api/plays', async (route) => {
    posted.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  return { posted };
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

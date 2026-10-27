import { test as base, expect, type Page, type Route } from '@playwright/test';

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
export async function fakeSignedInVisitor(
  page: Page,
  user: { displayName: string; email: string; emailConfirmed?: boolean },
): Promise<void> {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ emailConfirmed: true, ...user }),
    }),
  );
}

/** The demo listener of the mocks. */
export const NADIA = { displayName: 'Nadia Charles', email: 'nadia@hummi.fm', emailConfirmed: true };

/** How one faked /api/auth endpoint answers: a status (200 by default), a delay and a body. */
export interface AuthAnswer {
  status?: number;
  delayMs?: number;
  body?: unknown;
}

/**
 * Answers POST /api/auth/{endpoint} for sign-up, verify-email, resend-confirmation, sign-in and sign-out.
 * Each endpoint keeps the JSON bodies it was sent. Failures answer problem details with the given body.
 */
export async function fakeAuth(
  page: Page,
  answers: Partial<
    Record<
      | 'sign-up'
      | 'verify-email'
      | 'resend-confirmation'
      | 'sign-in'
      | 'sign-out'
      | 'password-reset'
      | 'password-reset/confirm',
      AuthAnswer
    >
  > = {},
): Promise<Record<string, unknown[]>> {
  const sent: Record<string, unknown[]> = {};
  const defaults: Record<string, AuthAnswer> = {
    'sign-up': { status: 202 },
    'verify-email': { status: 200, body: { displayName: 'Nadia', email: 'nadia@example.com', emailConfirmed: true } },
    'resend-confirmation': { status: 202 },
    'sign-in': { status: 200, body: NADIA },
    'sign-out': { status: 204 },
    'password-reset': { status: 202 },
    'password-reset/confirm': { status: 204 },
  };
  for (const endpoint of Object.keys(defaults)) {
    sent[endpoint] = [];
    await page.route(`**/api/auth/${endpoint}`, async (route) => {
      const answer = { ...defaults[endpoint], ...answers[endpoint as keyof typeof answers] };
      sent[endpoint].push(route.request().postDataJSON());
      if (answer.delayMs) await new Promise((resolve) => setTimeout(resolve, answer.delayMs));
      const status = answer.status ?? 200;
      const problem = status >= 400;
      await route.fulfill({
        status,
        contentType: problem ? 'application/problem+json' : 'application/json',
        body:
          status === 202 || status === 204
            ? ''
            : JSON.stringify(answer.body ?? { title: 'Server error', code: 'UNEXPECTED' }),
      });
    });
  }
  return sent;
}

export interface FakeTrack {
  id: string;
  slug: string;
  title: string;
  artistName: string;
  durationSeconds: number;
  coverUrl: string | null;
  liked: boolean;
  genreSlug: string | null;
  genreName: string | null;
}

const GENRE_NAMES: Record<string, string> = {
  soca: 'Soca',
  steelpan: 'Steelpan & Calypso',
  'island-chill': 'Island chill',
};

const track = (
  id: string,
  title: string,
  artistName: string,
  durationSeconds: number,
  liked = false,
  genreSlug: string | null = 'soca',
): FakeTrack => ({
  id,
  slug: id,
  title,
  artistName,
  durationSeconds,
  coverUrl: null,
  liked,
  genreSlug,
  genreName: genreSlug ? GENRE_NAMES[genreSlug] : null,
});

/** The demo catalogue, as Hummi.Cli seed writes it. */
export const TRACKS = {
  feathersUp: track('feathers-up', 'Feathers Up', 'Kaiso Collective', 222),
  jouvert: track('jouvert-morning', 'J’ouvert Morning', 'Kaiso Collective', 238),
  roadMarch: track('road-march-riddim', 'Road March Riddim', 'Lady Tamboo', 245),
  bigTruck: track('big-truck-energy', 'Big Truck Energy', 'Lady Tamboo', 201),
  panyard: track('panyard-nights', 'Panyard Nights', 'Laventille Steel Orchestra', 400, false, 'steelpan'),
  redLight: track('red-light-riddim', 'Red Light Riddim', 'Shanique', 182, true),
  longTitle: track(
    'a-very-long-title',
    'The Quiet Between Two Lighthouses, Revisited (Extended Dream Mix)',
    'Panorama Players',
    439,
    false,
    'island-chill',
  ),
  wineSlow: track('wine-slow', 'Wine Slow', 'Marisol Vega', 210),
  chrome: track('chrome-and-copper', 'Chrome and Copper', 'Lady Tamboo', 190),
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

const tile = (slug: string, name: string, tone: number, trackCount: number) => ({ slug, name, tone, trackCount });

/** GET /api/genres for the demo catalogue: the ten genres and the first seven as moods. */
export const DIRECTORY = (() => {
  const genres = [
    tile('soca', 'Soca', 1, 1204),
    tile('kids', 'Kids', 2, 610),
    tile('steelpan', 'Steelpan & Calypso', 3, 488),
    tile('dancehall', 'Dancehall', 5, 702),
    tile('island-chill', 'Island chill', 4, 515),
    tile('parang', 'Parang', 6, 233),
    tile('chutney', 'Chutney', 1, 340),
    tile('reggae', 'Reggae', 4, 520),
    tile('zouk', 'Zouk', 3, 110),
    tile('rapso', 'Rapso', 2, 90),
  ];
  return { genreCount: 10, openlyLicensedTrackCount: 4812, moods: genres.slice(0, 7), genres };
})();

/** Answers GET /api/genres. */
export async function fakeGenres(page: Page, options: { status?: number } = {}): Promise<void> {
  await page.route('**/api/genres', (route) =>
    route.fulfill(
      (options.status ?? 200) === 200
        ? { status: 200, contentType: 'application/json', body: JSON.stringify(DIRECTORY) }
        : {
            status: options.status,
            contentType: 'application/problem+json',
            body: JSON.stringify({ title: 'Server error', code: 'UNEXPECTED' }),
          },
    ),
  );
}

/** The Soca page's tracks newest first; most played reverses them. */
export const SOCA_NEWEST = [TRACKS.feathersUp, TRACKS.bigTruck, TRACKS.panyard, TRACKS.redLight];

/**
 * Answers GET /api/genres/{slug}/tracks for Soca (or an empty genre), ordering by the sort parameter;
 * keeps every requested sort.
 */
export async function fakeGenreTracks(
  page: Page,
  options: { empty?: boolean; trackCount?: number; tracks?: FakeTrack[] } = {},
): Promise<{ sorts: string[] }> {
  const sorts: string[] = [];
  await page.route(/\/api\/genres\/[^/]+\/tracks/, (route) => {
    const url = new URL(route.request().url());
    const sort = url.searchParams.get('sort') ?? 'newest';
    sorts.push(sort);
    const newest = options.tracks ?? SOCA_NEWEST;
    const tracks = options.empty ? [] : sort === 'most-played' ? [...newest].reverse() : newest;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        slug: 'soca',
        name: 'Soca',
        description: 'road-march riddims, J’ouvert mornings and fete anthems',
        tone: 1,
        trackCount: options.empty ? 0 : (options.trackCount ?? 1204),
        sort,
        page: 1,
        pageSize: 50,
        tracks,
      }),
    });
  });
  return { sorts };
}

/** Answers a GET with the body, or with problem details when status is not 200; returns how many times it was asked. */
async function fakeGet(
  page: Page,
  url: string | RegExp,
  body: unknown,
  options: { status?: number; code?: string; delayMs?: number } = {},
): Promise<{ calls: () => number }> {
  let calls = 0;
  await page.route(url, async (route) => {
    calls++;
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    const status = options.status ?? 200;
    await route.fulfill(
      status === 200
        ? { status, contentType: 'application/json', body: JSON.stringify(body) }
        : {
            status,
            contentType: 'application/problem+json',
            body: JSON.stringify({
              title: status === 404 ? 'Not found' : 'Server error',
              status,
              code: options.code ?? (status === 404 ? 'NOT_FOUND' : 'UNEXPECTED'),
            }),
          },
    );
  });
  return { calls: () => calls };
}

/** 64 waveform peaks from 25 to 95, the shape the track page mock draws. */
export const PEAKS = Array.from({ length: 64 }, (_, i) =>
  Math.round(25 + 70 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.21))),
);

/** GET /api/tracks/feathers-up as the demo catalogue answers it. */
export const FEATHERS_UP_DETAIL = {
  id: TRACKS.feathersUp.id,
  slug: 'feathers-up',
  title: 'Feathers Up',
  durationSeconds: 222,
  coverUrl: null,
  artist: { slug: 'kaiso-collective', name: 'Kaiso Collective' },
  album: { slug: 'mas-on-the-avenue', title: 'Mas on the Avenue' },
  genre: 'Soca',
  generatedWith: 'openmusic-3b',
  licence: 'cc0',
  licenceLabel: 'CC0 1.0 (public domain)',
  plays: 128904,
  playable: true,
  liked: false,
  waveform: PEAKS,
  moreFromArtist: [TRACKS.jouvert],
  similar: [],
};

/** Feathers Up after its creator withdrew it: not playable, with Similar tracks instead of More from. */
export const WITHDRAWN_DETAIL = {
  ...FEATHERS_UP_DETAIL,
  playable: false,
  moreFromArtist: [],
  similar: [TRACKS.roadMarch, TRACKS.panyard],
};

/** Answers GET /api/tracks/{slug} with the detail (Feathers Up by default); every slug gets the same answer. */
export async function fakeTrack(
  page: Page,
  options: { detail?: unknown; status?: number; delayMs?: number } = {},
): Promise<{ calls: () => number }> {
  return fakeGet(page, /\/api\/tracks\/[^/?]+$/, options.detail ?? FEATHERS_UP_DETAIL, {
    ...options,
    code: 'TRACK_NOT_FOUND',
  });
}

export const KAISO_DETAIL = {
  slug: 'kaiso-collective',
  name: 'Kaiso Collective',
  modelName: 'openmusic-3b',
  description:
    'A soca band generated with an open-weights model. Brass sections, iron rhythm and road-march hooks, recorded live on the Avenue.',
  monthlyListeners: 48210,
  coverUrl: null,
  following: false,
  popular: [TRACKS.feathersUp, TRACKS.jouvert],
  releases: [{ slug: 'mas-on-the-avenue', title: 'Mas on the Avenue', year: 2026, trackCount: 2, coverUrl: null }],
};

/** Answers GET /api/artists/{slug} (Kaiso Collective by default). */
export async function fakeArtist(
  page: Page,
  options: { detail?: unknown; status?: number; delayMs?: number } = {},
): Promise<{ calls: () => number }> {
  return fakeGet(page, /\/api\/artists\/[^/?]+$/, options.detail ?? KAISO_DETAIL, {
    ...options,
    code: 'ARTIST_NOT_FOUND',
  });
}

export const MAS_DETAIL = {
  slug: 'mas-on-the-avenue',
  title: 'Mas on the Avenue',
  year: 2026,
  artist: { slug: 'kaiso-collective', name: 'Kaiso Collective' },
  coverUrl: null,
  summary: '2026 · 2 tracks · 8 min · CC0 1.0 (public domain)',
  tracks: [TRACKS.feathersUp, TRACKS.jouvert],
};

/** Answers GET /api/albums/{slug} (Mas on the Avenue by default). */
export async function fakeAlbum(
  page: Page,
  options: { detail?: unknown; status?: number; delayMs?: number } = {},
): Promise<{ calls: () => number }> {
  return fakeGet(page, /\/api\/albums\/[^/?]+$/, options.detail ?? MAS_DETAIL, { ...options, code: 'ALBUM_NOT_FOUND' });
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

/** GET /api/search for "pan", as the demo catalogue answers it. */
export const PAN_RESULTS = {
  query: 'pan',
  topResult: TRACKS.panyard,
  artists: [
    { slug: 'laventille-steel-orchestra', name: 'Laventille Steel Orchestra' },
    { slug: 'panorama-players', name: 'Panorama Players' },
    { slug: 'pan-masters', name: 'Pan Masters' },
  ],
  songs: [TRACKS.panyard, TRACKS.longTitle, TRACKS.feathersUp],
};

/**
 * Answers GET /api/search: PAN_RESULTS for "pan", no matches for anything else, or problem details when
 * status is set. Keeps each query asked.
 */
export async function fakeSearch(
  page: Page,
  options: { status?: number; delayMs?: number } = {},
): Promise<{ queries: string[] }> {
  const queries: string[] = [];
  await page.route('**/api/search?*', async (route) => {
    const q = new URL(route.request().url()).searchParams.get('q') ?? '';
    queries.push(q);
    if (options.delayMs) await new Promise((resolve) => setTimeout(resolve, options.delayMs));
    if (options.status)
      return route.fulfill({
        status: options.status,
        contentType: 'application/problem+json',
        body: JSON.stringify({
          title: 'Search isn’t working right now',
          status: options.status,
          code: 'SEARCH_UNAVAILABLE',
        }),
      });
    const body = q === 'pan' ? PAN_RESULTS : { query: q, topResult: null, artists: [], songs: [] };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return { queries };
}

export const KAISO_TILE = {
  slug: 'kaiso-collective',
  name: 'Kaiso Collective',
  monthlyListeners: 48210,
  coverUrl: null,
};

export const LIBRARY = {
  playlistCount: 3,
  likedCount: 2,
  followingCount: 1,
  playlists: [
    { id: 'p1', name: 'Road trip to the north coast', trackCount: 24, ownerName: 'Nadia Charles', coverUrl: null },
    { id: 'p2', name: 'Rainy-day panyard', trackCount: 18, ownerName: 'Nadia Charles', coverUrl: null },
    { id: 'p3', name: 'Sunday kitchen', trackCount: 31, ownerName: 'Mei Rodríguez', coverUrl: null },
  ],
  liked: [
    { ...TRACKS.feathersUp, liked: true },
    { ...TRACKS.panyard, liked: true },
  ],
  following: [KAISO_TILE],
};

export const EMPTY_LIBRARY = {
  playlistCount: 0,
  likedCount: 0,
  followingCount: 0,
  playlists: [],
  liked: [],
  following: [],
};

/**
 * GET /api/me/library answers the given library (each call can answer a different one, for the
 * cross-device test); PUT and DELETE on likes and follows answer writeStatus and are recorded.
 */
export async function fakeLibrary(
  page: Page,
  options: { body?: unknown | (() => unknown); status?: number; writeStatus?: number } = {},
): Promise<{ writes: string[]; reads: () => number }> {
  const writes: string[] = [];
  let reads = 0;
  await page.route('**/api/me/library', (route) => {
    reads++;
    const status = options.status ?? 200;
    const body = typeof options.body === 'function' ? (options.body as () => unknown)() : (options.body ?? LIBRARY);
    return route.fulfill(
      status === 200
        ? { status, contentType: 'application/json', body: JSON.stringify(body) }
        : {
            status,
            contentType: 'application/problem+json',
            body: JSON.stringify({ title: 'Server error', code: 'UNEXPECTED' }),
          },
    );
  });
  await page.route(/\/api\/me\/(likes|follows)\/[^/?]+$/, (route) => {
    const url = new URL(route.request().url());
    writes.push(`${route.request().method()} ${url.pathname}`);
    const status = options.writeStatus ?? 204;
    if (status === 0) return route.abort('internetdisconnected');
    return route.fulfill({ status, body: '' });
  });
  return { writes, reads: () => reads };
}

export interface FakePlaylist {
  id: string;
  name: string;
  isPublic: boolean;
  ownerName: string;
  isOwner: boolean;
  tracks: FakeTrack[];
}

/** Which playlist calls fail and how: an HTTP status, or 0 for a dropped connection. */
export type PlaylistFailures = Partial<
  Record<'create' | 'update' | 'delete' | 'membership' | 'append' | 'remove' | 'get', number>
>;

/**
 * A stateful fake of the playlist endpoints over the given playlists: /api/me/playlists,
 * /api/me/playlist-membership, /api/playlists and /api/playlists/{id}[/tracks|/entries/remove].
 * Calls are recorded as "{METHOD} {path}" with their bodies; failures answer problem details.
 */
export async function fakePlaylists(
  page: Page,
  start: FakePlaylist[] = [],
  failures: PlaylistFailures = {},
): Promise<{ playlists: FakePlaylist[]; calls: { call: string; body: unknown }[]; failures: PlaylistFailures }> {
  const playlists = start.map((p) => ({ ...p, tracks: [...p.tracks] }));
  const calls: { call: string; body: unknown }[] = [];
  const all = Object.values(TRACKS);
  let next = playlists.length + 1;
  const json = (body: unknown, status = 200) => ({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
  const problem = (status: number, code = 'UNEXPECTED', title = 'Server error') => ({
    status,
    contentType: 'application/problem+json',
    body: JSON.stringify({ title, code }),
  });
  const detail = (p: FakePlaylist) => ({
    id: p.id,
    name: p.name,
    isPublic: p.isPublic,
    isOwner: p.isOwner,
    ownerName: p.ownerName,
    trackCount: p.tracks.length,
    durationSeconds: p.tracks.reduce((sum, t) => sum + t.durationSeconds, 0),
    entries: p.tracks.map((track, i) => ({ entryId: `${p.id}-e${i}`, track })),
  });
  const fail = async (route: Route, key: keyof PlaylistFailures): Promise<boolean> => {
    const status = failures[key];
    if (status === undefined) return false;
    if (status === 0) await route.abort('internetdisconnected');
    else await route.fulfill(problem(status));
    return true;
  };
  await page.route(/\/api\/(me\/playlists|me\/playlist-membership|playlists)(\/|\?|$)/, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const body = request.postDataJSON?.() ?? null;
    calls.push({ call: `${method} ${url.pathname}`, body });
    const [, , , id, sub, action] = url.pathname.split('/');
    if (url.pathname === '/api/me/playlists') {
      const trackId = url.searchParams.get('trackId');
      return route.fulfill(
        json(
          playlists
            .filter((p) => p.isOwner)
            .map((p) => ({
              id: p.id,
              name: p.name,
              trackCount: p.tracks.length,
              containsTrack: p.tracks.some((t) => t.id === trackId),
            })),
        ),
      );
    }
    if (url.pathname === '/api/me/playlist-membership') {
      if (await fail(route, 'membership')) return;
      const { trackId, playlistIds } = body as { trackId: string; playlistIds: string[] };
      const track = all.find((t) => t.id === trackId)!;
      const added = [];
      const removed = [];
      for (const p of playlists.filter((p) => p.isOwner)) {
        const has = p.tracks.some((t) => t.id === trackId);
        if (playlistIds.includes(p.id) && !has) {
          p.tracks.push(track);
          added.push({ id: p.id, name: p.name, position: p.tracks.length });
        } else if (!playlistIds.includes(p.id) && has) {
          p.tracks = p.tracks.filter((t) => t.id !== trackId);
          removed.push(p.id);
        }
      }
      return route.fulfill(json({ added, removed }));
    }
    if (!id && method === 'POST') {
      if (await fail(route, 'create')) return;
      const { name, isPublic, trackIds } = body as { name: string; isPublic: boolean; trackIds: string[] };
      const p: FakePlaylist = {
        id: `new${next++}`,
        name,
        isPublic,
        ownerName: 'Nadia Charles',
        isOwner: true,
        tracks: (trackIds ?? []).map((t) => all.find((a) => a.id === t)!),
      };
      playlists.push(p);
      return route.fulfill(json({ id: p.id, name: p.name, position: p.tracks.length }, 201));
    }
    const p = playlists.find((x) => x.id === id);
    if (!p) return route.fulfill(problem(404, 'PLAYLIST_NOT_FOUND', 'This playlist isn’t on Hummi'));
    if (!sub && method === 'GET') {
      if (await fail(route, 'get')) return;
      return route.fulfill(json(detail(p)));
    }
    if (!sub && method === 'PUT') {
      if (await fail(route, 'update')) return;
      Object.assign(p, body);
      return route.fulfill({ status: 204, body: '' });
    }
    if (!sub && method === 'DELETE') {
      if (await fail(route, 'delete')) return;
      playlists.splice(playlists.indexOf(p), 1);
      return route.fulfill({ status: 204, body: '' });
    }
    if (sub === 'tracks') {
      if (await fail(route, 'append')) return;
      const { trackIds, allowDuplicates } = body as { trackIds: string[]; allowDuplicates: boolean };
      const fresh = allowDuplicates ? trackIds : trackIds.filter((t) => !p.tracks.some((x) => x.id === t));
      if (!fresh.length) return route.fulfill(problem(409, 'ALREADY_IN_PLAYLIST', 'Already in this playlist'));
      p.tracks.push(...fresh.map((t) => all.find((a) => a.id === t)!));
      return route.fulfill(json({ id: p.id, name: p.name, position: p.tracks.length }));
    }
    if (sub === 'entries' && action === 'remove') {
      if (await fail(route, 'remove')) return;
      const { entryIds } = body as { entryIds: string[] };
      const keep = detail(p)
        .entries.filter((e) => !entryIds.includes(e.entryId))
        .map((e) => e.track);
      p.tracks = keep;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill(problem(501, 'NO_FAKE'));
  });
  return { playlists, calls, failures };
}

export const ROAD_TRIP: FakePlaylist = {
  id: 'p1',
  name: 'Road trip to the north coast',
  isPublic: false,
  ownerName: 'Nadia Charles',
  isOwner: true,
  tracks: [TRACKS.jouvert, TRACKS.feathersUp, TRACKS.panyard],
};

export const RAINY_DAY: FakePlaylist = {
  id: 'p2',
  name: 'Rainy-day panyard',
  isPublic: false,
  ownerName: 'Nadia Charles',
  isOwner: true,
  tracks: [TRACKS.panyard],
};

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

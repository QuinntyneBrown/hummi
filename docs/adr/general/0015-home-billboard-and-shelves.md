# 0015. Home is a featured-album billboard and seven shelves, each loaded on its own

Status: Accepted (2026-10-27)

## Context

Journey 12 builds L2-001 and L2-002. Its prompt and the older `discovery/view-home` design described a
personal Home (greeting, featured mix, Continue listening, artists to follow) built by a
`FeaturedMixBuilder`, served by an Angular service worker offline. The requirements and the Home mock
had since moved to a featured album billboard and genre shelves; requirements are the source. L2-001 AC5
still asked for outlined rank numerals although ADR 0005 made the Top 10 a numbered track list.

## Decision

- **Content.** Home follows L2-001: the billboard, then Recently added, Top 10 on Hummi this week, Soca,
  Kids, Steelpan & Calypso, Dancehall and Island chill, each with See all (Browse for the first two, the
  genre page for the rest). L2-001 AC5 now reads "rows numbered by rank from 1 to 10". The greeting and the
  featured mix are dropped; genre shelves are the "similar" rule (same genre, most played first).
- **Endpoints.** `GET /api/home` is replaced by `GET /api/home/summary` (`hasHistory`),
  `GET /api/home/featured` and `GET /api/home/shelves/{key}` (`recently-added`, `top-10` or a genre slug;
  12 tracks per genre shelf; `newTrackIds` are tracks added in the last 7 days). Each part loads and
  fails on its own; a failed shelf shows "{name} didn’t load" with Try again; when every part fails, the
  whole-page error block shows.
- **Billboard.** The newest published album with a kicker (`Album.Kicker`, `Album.Blurb`, migration
  `AddAlbumFeature`; the seed features Mas on the Avenue), else the newest published album. Play album plays
  the lead track and reads Pause while the album plays. Add to library likes the album's tracks
  (`LibraryStore.likeAll`), asking `SignInGate` first, and shows the pill "Added {album} to your library".
- **Empty.** A signed-in listener without a play event sees "Your Home fills up as you listen" and six
  genre tiles. A visitor always sees the content, since their history is unknown.
- **Offline.** No service worker: `HomeApi` keeps each part that loaded in `localStorage`; offline it answers
  from there, so only the billboard and the saved shelves render, under Home's warning banner. A part with
  no saved copy is left out rather than shown as failed.
- **Library placement.** Home moves from `@hummi/player` to `@hummi/discovery` (ADR 0005 foresaw it);
  discovery's routes come before the player's so its `''` route is reached.
- **Components.** `hm-billboard` (also in the design system), `hm-shelf` gains See all and the Previous and
  Next arrows, `hm-track-card` the New badge, and `hm-icon` a `back` chevron.

## Consequences

- Home makes nine small requests instead of one.
- What an offline device shows is whatever this browser last loaded, not a curated offline set.

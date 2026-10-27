# 0008. Search is a header overlay over songs and artists, matched in SQL behind ISearchIndex

Status: Accepted (2026-10-27)

## Context

Journey 05 (search the catalogue) builds L2-006 and L2-007. Since ADR 0004 those requirements describe
a search layer over the current page with Top result, Artists and Songs, but `docs/journeys.md`, the
journey prompt and L2-048 AC5 still spoke of a `/search` page with tabs for tracks, artists and
playlists, and the design left the recent-search count and the query limit open. There is no playlist
entity yet (the library journeys add it), and no search engine is in the stack.

## Decision

- L2-006 and L2-007 are the source: search is the overlay of ADR 0004, with no result-type tabs and no
  playlists. L2-048 AC5 now names only the Library tab list; `docs/journeys.md` describes the overlay.
- Matching runs in the Hummi database through the `ISearchIndex` port: `SqlSearchIndex` uses
  `EF.Functions.Like` over track titles and artist names, with `%`, `_` and `[` escaped. Matches that
  start with the query rank first, then by play count (songs) or monthly listeners (artists). A dedicated
  search engine is deferred; it would replace only the adapter.
- `GET /api/search?q=` returns `{ query, topResult, artists (≤ 3), songs (≤ 7) }`; the top result is the
  first song. The query is trimmed and must be 1 to 100 characters (422 otherwise). A database failure
  in the adapter raises `SearchUnavailableException`, which the handler turns into 503 `SEARCH_UNAVAILABLE`.
- The overlay searches 250 ms after the last keystroke and at once on Enter. A query joins the recent
  searches (6 at most, newest first, no duplicates, `localStorage` key `hummi.recent-searches`) when the
  listener presses Enter or chooses a result.
- `SearchStore` in `@hummi/api` owns the open state so the shell and later the track menu can open the
  layer. The overlay component lives in the new `@hummi/search` library and the shell renders it.
  `/search?q=` opens the layer with that query over Home, so existing "Search Hummi" links keep working.
- "More from {artist}" (L2-006 AC1) arrives with the track menu (L2-053), which will call
  `SearchStore.openWith(artist)`.

## Consequences

- Search is a substring match: no stemming, typo tolerance or relevance scoring until an engine lands.
- `LIKE '%q%'` scans the tracks and artists tables; fine for the demo catalogue, revisit with the engine.
- No migration: search reads existing columns.

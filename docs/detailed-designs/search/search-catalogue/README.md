# Search the catalogue

## Overview

Search (`/search`) finds tracks, artists and playlists by text. A listener types into the top-bar
search field on any shell page; submitting opens Search with the query kept in the field and the
results grouped by type. Tabs narrow the results to one type.

- **query** — free text the listener submits, carried in the URL as `?q=`
- **result type** — one of `Track`, `Artist`, `Playlist`; the tab `All` shows every type
- **recent search** — query the listener ran earlier, listed on the empty Search page so it can run again

Only public playlists and published tracks are searchable. A query with no match shows a no-results
state; an unreachable search backend shows an error that keeps the query in the field.

## Description

Search is a read slice. The first release matches text in the database; the matching technique is isolated behind the `ISearchIndex` port so a dedicated engine can replace it.

**Frontend — Hummi web application (Angular)**

- **`TopBarSearchComponent`** — Shell component in the hummi application. Wraps `hm-search-field` ("Search tracks, artists, playlists") and navigates to `/search?q=` on submit; `/` focuses it (`L2-017`)
- **`SearchPage`** — Routed component in @hummi/search. Renders `hm-tabs` (All, Tracks, Artists, Playlists), the Tracks and Playlists shelves, skeleton rows while busy, and the empty, no-results and error states
- **`RecentSearchesStore`** — Signal store in @hummi/search. Keeps the last queries in `localStorage` for the device. Maximum count: <TO SUPPLY>
- **`SearchApi`** — Typed HTTP service in @hummi/api. Calls `GET /api/search?q=&type=`

**Backend — Hummi.Api application**

- **`SearchController`** — ASP.NET Core controller. Exposes `GET /api/search`; returns 503 ProblemDetails when the index is unreachable

**Backend — Hummi Application and Domain**

- **`SearchCatalogueQueryHandler`** — MediatR query handler. Validates the query (trimmed, 1 to 100 characters <TO SUPPLY: limit>), calls `ISearchIndex` and groups hits by type
- **`ISearchIndex`** — Application port. `SearchAsync(text, type, take)` returns ranked hits of tracks, artists and public playlists

**Backend — Hummi Infrastructure**

- **`SqlSearchIndex`** — Infrastructure adapter. Implements `ISearchIndex` with `LIKE` and full-text predicates over titles and names
- **`Hummi database`** — Azure SQL. Tracks, artists and public playlists

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-006` | `L1-002` | **Search results.** 1. Given any page with the shell, when a listener submits a query in the top-bar search field ("Search tracks, artists, playlists"), then Search (`/search`) opens with the query kept in the field.<br>2. Given the query "rain", when results return, then the subtitle shows the result count (e.g. "7 results") and the page shows tabs "All" (selected), "Tracks", "Artists", "Playlists", a "Tracks" shelf and a "Playlists" shelf.<br>3. Given the result tabs, when the listener selects "Tracks", "Artists" or "Playlists", then only results of that type are shown.<br>4. Given a search in progress, when results have not returned, then the subtitle reads "Searching…" and skeleton rows are shown. |
| `L2-007` | `L1-002` | **Search empty, no-results and error states.** 1. Given an empty query, when Search opens, then it shows "Search Hummi" with "Find tracks, artists and playlists. Searches you run show up here so you can repeat them." and a "Try a genre" shelf of genre chips.<br>2. Given the listener has run searches before, when the empty Search page opens, then those searches are listed and selecting one runs it again.<br>3. Given the query "rainfall in b-flat" with no matches, when results return, then the subtitle reads "0 results" and the page shows "Nothing matches “rainfall in b-flat”" with "Check the spelling, use fewer words, or browse by genre instead.", a "Clear search" button that empties the query, and a "Browse genres" button.<br>4. Given search is unreachable, when the query is run, then the page shows "Search isn’t working right now" with "We couldn’t reach search. Your query is still in the box; try again in a moment." and the query remains in the field. |

## Diagrams

### System context

A listener searches Hummi. No external system takes part in the first release.

![C4 system context for search the catalogue](diagrams/c4-context.png)

### Containers

The Angular application is delivered by the `web` container, which also proxies `/api` to `Hummi.Api`; the API reads and writes the Hummi database through EF Core.

![C4 container view for search the catalogue](diagrams/c4-container.png)

### Components

`TopBarSearchComponent` routes to `SearchPage`, which calls `SearchApi`. `SearchController` sends `SearchCatalogueQuery`; the handler uses the `ISearchIndex` port, implemented by `SqlSearchIndex`.

![C4 component view for search the catalogue](diagrams/c4-component.png)

### Class structure

`SearchCatalogueQueryHandler` depends on the `ISearchIndex` abstraction, which `SqlSearchIndex` realizes. Hits carry a `SearchResultType` and the handler groups them into `SearchResultsDto`.

![Class diagram for search the catalogue](diagrams/class-structure.png)

### Behaviour — run a search

Submitting navigates to `/search?q=`, so the query survives reloads and stays in the field. The handler delegates matching to `ISearchIndex`; an unreachable index becomes a 503 that the page renders as the error state of `L2-007`.

![Sequence diagram for run a search](diagrams/sequence-search.png)

### Behaviour — filter by type and repeat a recent search

Tabs re-query with a type filter. With no query, the page lists the device's recent searches from `RecentSearchesStore` and runs one again when selected.

![Sequence diagram for filter by type and repeat a recent search](diagrams/sequence-filter-and-empty.png)

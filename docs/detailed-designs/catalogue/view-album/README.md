# View an album

## Overview

An album page (`/albums/{slug}`) lists the tracks of one release by one artist, with a summary of year,
track count, total minutes and licence. A published album always holds at least one track, so the
page has no empty state.

- **album** — ordered collection of tracks released together by one artist
- **album summary** — line "{year} · {n} tracks · {minutes} min · {licence}"

## Description

The slice is one read query. The publish invariant lives in the `Album` entity.

**Frontend — Hummi web application (Angular)**

- **`AlbumPage`** — Routed component in @hummi/catalogue. Renders the header, Play, Add to playlist and Share, `hm-track-list` and the summary line. Add to playlist and Share are wired by later journeys
- **`AlbumsApi`** — Typed HTTP service in @hummi/api. Calls `GET /api/albums/{slug}`
- **`PlayerStore`** — Signal store in @hummi/api. Owns the queue, the current track, position and play state, and drives the `HTMLAudioElement`

**Backend — Hummi.Api application**

- **`AlbumsController`** — ASP.NET Core controller. Returns 200 `AlbumDetailDto` or 404

**Backend — Hummi Application and Domain**

- **`GetAlbumQueryHandler`** — MediatR query handler. Loads a published album with its playable tracks in `AlbumPosition` order and builds the summary: minutes are the total seconds divided by 60, rounded up (460 s is 8 min); the licence is the one every track shares, otherwise "mixed licences". An unpublished or unknown album is 404
- **`Album`** — Domain entity. `Publish(tracks)` fails unless it is given at least one track, all of them the album's own (`L2-011`)

**Backend — Hummi Infrastructure**

- **`HummiDbContext`** — EF Core DbContext. Implements the `IHummiDbContext` port from `Application/Abstractions` and maps entities to tables
- **`Hummi database`** — Azure SQL. Albums and tracks

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-011` | `L1-003` | **Album page.** 1. Given the album Mas on the Avenue, when a listener opens `/albums/mas-on-the-avenue`, then the heading is "Mas on the Avenue" and the subtitle is "Kaiso Collective · Album" with the artist linked.<br>2. Given the album page, when it loads, then it shows "Play", "Add to playlist" and "Share" buttons, the album track list, and the summary "{year} · {n} tracks · {minutes} min · {licence}" (e.g. "2026 · 2 tracks · 8 min · CC0 1.0 (public domain)").<br>3. Given any album, when it is published, then it has at least one track; the album page has no empty state. |

## Diagrams

### System context

A listener opens an album page in Hummi. No external system takes part.

![C4 system context for view an album](diagrams/c4-context.png)

### Containers

The Angular application is delivered by the `web` container, which also proxies `/api` to `Hummi.Api`; the API reads and writes the Hummi database through EF Core.

![C4 container view for view an album](diagrams/c4-container.png)

### Components

`AlbumPage` calls `AlbumsApi` and `PlayerStore`; `AlbumsController` sends `GetAlbumQuery` to its handler.

![C4 component view for view an album](diagrams/c4-component.png)

### Class structure

A `Track` joins an `Album` through `AlbumId` and `AlbumPosition`; `Album.Publish(tracks)` enforces the at-least-one-track rule.

![Class diagram for view an album](diagrams/class-structure.png)

### Behaviour — open and play an album

The handler returns tracks in album order with a precomposed summary line; Play hands the list to `PlayerStore`.

![Sequence diagram for open and play an album](diagrams/sequence-open-album.png)

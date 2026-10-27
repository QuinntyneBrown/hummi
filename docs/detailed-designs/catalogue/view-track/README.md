# View a track

## Overview

The catalogue subsystem presents what Hummi carries: tracks, artists, albums and their licences. The
track page (`/tracks/{slug}`) is the canonical page of one track. It shows the track's artist and
album, its waveform, a details list that names the open-weights model that generated it and its
licence, and a shelf of more tracks by the same artist. From here the listener plays, likes, adds to
a playlist, shares or reports the track.

- **open-weights model** — generative model whose weights are publicly released, named in "Generated with" (e.g. `openmusic-3b`)
- **withdrawn track** — track its creator removed from playback; its page remains, with a notice and similar tracks
- **waveform** — precomputed amplitude peaks drawn as bars, filled up to the played proportion

A slug that matches no track yields the Not found page (`L2-044`).

## Description

The slice is one read query and the page that renders it; actions delegate to other subsystems.

**Frontend — Hummi web application (Angular)**

- **`TrackPage`** — Routed component in @hummi/catalogue. Renders `hm-page-header`, the action bar, `hm-waveform`, the Details `hm-description-list` and the More from shelf; a withdrawn track shows `hm-alert` (warning) and the Similar tracks shelf
- **`TracksApi`** — Typed HTTP service in @hummi/api. Calls `GET /api/tracks/{slug}`
- **`DialogService`** — Service in @hummi/components. Opens `hm-dialog` components as modal overlays and returns a typed close result (`L2-047`)

**Backend — Hummi.Api application**

- **`TracksController`** — ASP.NET Core controller. Returns 200 `TrackDetailDto` or 404 ProblemDetails

**Backend — Hummi Application and Domain**

- **`GetTrackQueryHandler`** — MediatR query handler. Loads the track with artist, album and genre, adds More from or Similar tracks, and sets `Playable`
- **`Track`** — Domain entity. `IsPlayable()` returns false when `Status` is `Withdrawn` (`L2-009`)

**Backend — Hummi Infrastructure**

- **`HummiDbContext`** — EF Core DbContext. Implements the `IHummiDbContext` port from `Application/Abstractions` and maps entities to tables
- **`Hummi database`** — Azure SQL. Tracks, artists, albums and genres

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-008` | `L1-003` | **Track page.** 1. Given the track Slow Orbit, when a listener opens `/tracks/slow-orbit`, then the heading is "Slow Orbit", the subtitle is "Lumen Fox · Night Garden" with the artist linking to the artist page, and the overline is "Track · 4:12".<br>2. Given the track page, when it loads, then it shows the actions "Play", "Like Slow Orbit", "Add to playlist", "Share" and "Report this track", and a waveform showing the played proportion.<br>3. Given the track page, when it loads, then a "Details" list shows Artist (link), Album (link), Genre, "Generated with" (e.g. "openmusic-3b (open weights)"), Licence (link to the licence page, e.g. "CC0 1.0 (public domain)") and Plays (e.g. "128,904").<br>4. Given the track page, when it loads, then a "More from {artist}" shelf lists other tracks by the same artist.<br>5. Given "Add to playlist", "Share" or "Report this track", when activated, then the matching dialog opens (L2-020, L2-025, L2-038). |
| `L2-009` | `L1-003` | **Withdrawn track.** 1. Given a track its creator withdrew, when a listener opens its page, then a warning reads "This track is no longer available" with "Its creator withdrew it, so we can’t play it. It was licensed {licence}; copies already shared keep that licence." and the track cannot be played.<br>2. Given a withdrawn track, when its page loads, then a "Similar tracks" shelf lists playable tracks.<br>3. Given a track id that does not exist, when a listener opens it, then the Not found page (L2-044) is shown. |

## Diagrams

### System context

A listener opens a track page in Hummi. No external system takes part.

![C4 system context for view a track](diagrams/c4-context.png)

### Containers

The Angular application is delivered by the `web` container, which also proxies `/api` to `Hummi.Api`; the API reads and writes the Hummi database through EF Core.

![C4 container view for view a track](diagrams/c4-container.png)

### Components

`TrackPage` calls `TracksApi`; `TracksController` sends `GetTrackQuery`, whose handler loads the `Track` entity through `HummiDbContext`.

![C4 component view for view a track](diagrams/c4-component.png)

### Class structure

`Track` holds its `Licence`, `ModelName` and `TrackStatus`; `GetTrackQueryHandler` projects it into `TrackDetailDto`, including the `Playable` flag from `IsPlayable()`.

![Class diagram for view a track](diagrams/class-structure.png)

### Behaviour — open a track page

The handler resolves the slug, asks the `Track` entity whether it is playable and selects the shelf accordingly. Actions open dialogs owned by the library, sharing and reporting subsystems.

![Sequence diagram for open a track page](diagrams/sequence-open-track.png)

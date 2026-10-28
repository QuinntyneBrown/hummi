# View licence and credit

## Overview

Every track on Hummi carries exactly one licence; every imported track carries the Pixabay Content
License (ADR 0021). The licence and credit page (`/tracks/{slug}/licence`) explains how the listener may
reuse a track, gives a ready-made credit line and links to the licence and to the track's Pixabay page.
A table lists the licences of the catalogue.

- **credit line** — attribution sentence "“{title} by {artist}, from Pixabay.”", or "“{title} by {artist}, generated with {model}.”" when the model is known
- **licence** — the Pixabay Content License (<https://pixabay.com/service/license-summary/>); CC0 1.0, CC BY 4.0 and CC BY-SA 4.0 remain valid values but no track carries them

The licence comparison is static product content; only the alert depends on the track.

## Description

The slice reuses the track query and keeps the licence table as typed constants in the frontend.

**Frontend — Hummi web application (Angular)**

- **`LicencePage`** — Routed component in @hummi/catalogue. Renders the header, the info `hm-alert` with the credit line, the Licences on Hummi `hm-table` and the Back to {title} link. An unknown slug shows Not found
- **`LICENCE_TERMS`** — Constant in @hummi/catalogue. Maps each `Licence` to its table name, the short name of the alert heading, permissions, conditions, the alert's terms and, for Pixabay, the licence URL. `TABLE_LICENCES` names the rows of the table: the Pixabay Content License only
- **`TracksApi`** — Typed HTTP service in @hummi/api. Calls `GET /api/tracks/{slug}`

**Backend — Hummi.Api application**

- **`TracksController`** — ASP.NET Core controller. Serves the same `TrackDetailDto` as the track page

**Backend — Hummi Application and Domain**

- **`GetTrackQueryHandler`** — MediatR query handler. Supplies title, artist, model (null when unknown), licence and source URL

**Backend — Hummi Infrastructure**

- **`HummiDbContext`** — EF Core DbContext. Implements the `IHummiDbContext` port from `Application/Abstractions` and maps entities to tables
- **`Hummi database`** — Azure SQL. Tracks

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-012` | `L1-003` | **Licence and credit page.** 1. Given a Pixabay track "{title}" by "{artist}", when a listener opens `/tracks/{slug}/licence`, then the heading is "Licence and credit" with "How you can reuse what you hear on Hummi" and an info alert "{title} is under the Pixabay Content License" with "{artist} shared it on Pixabay under the Pixabay Content License. You may use it for free, including commercially, and change it. Credit is not required but is appreciated:" followed by the credit line "“{title} by {artist}, from Pixabay.”", a "Read the Pixabay Content License" link to `https://pixabay.com/service/license-summary/` and a "View on Pixabay" link to the track's Pixabay page, both opening in a new tab.<br>2. Given the licence page, when it loads, then a "Licences on Hummi" table lists one row: Pixabay Content License — "Use, change and share for free, including commercially" — "Nothing; credit is appreciated. Don’t sell or redistribute it unaltered on its own, or claim it as your own".<br>3. Given the licence page, when it loads, then a "Back to {title}" link returns to the track page.<br>4. Given any track, when it is published, then it carries exactly one licence; every imported track carries the Pixabay Content License and the licence page has no empty state. A track whose model is known keeps the credit line "“{title} by {artist}, generated with {model}.”". |

## Diagrams

### System context

A listener reads reuse terms for a track in Hummi. No external system takes part.

![C4 system context for view licence and credit](diagrams/c4-context.png)

### Containers

The Angular application is delivered by the `web` container, which also proxies `/api` to `Hummi.Api`; the API reads and writes the Hummi database through EF Core.

![C4 container view for view licence and credit](diagrams/c4-container.png)

### Components

`LicencePage` calls `TracksApi` and reads `LICENCE_TERMS`; the API path is the track query of the view-track feature.

![C4 component view for view licence and credit](diagrams/c4-component.png)

### Class structure

`LicencePage` derives the credit line from `TrackDetailDto` and renders one `LicenceTerm` per `Licence` value.

![Class diagram for view licence and credit](diagrams/class-structure.png)

### Behaviour — open the licence page

The page combines the track DTO with the static `LICENCE_TERMS` table to build the alert and the three-row comparison.

![Sequence diagram for open the licence page](diagrams/sequence-open-licence.png)

# Import the Pixabay catalogue

## Overview

Hummi's catalogue is made only of real tracks from Pixabay Music (ADR 0021). A developer lists Pixabay
track pages in a committed manifest, runs `hummi import` to read each page, keep its metadata and download
its audio, and runs `hummi seed` to write exactly those tracks into a migrated database. Nothing describing
the catalogue is invented: a field the page does not give stays empty, a track the page cannot describe is
refused, and a cover is generated only when the track has none.

- **manifest** — `src/backend/Hummi.Cli/Catalogue/pixabay-manifest.json`, the source of truth: `sources` (track page URLs) and `tracks` (imported entries)
- **media cache** — `{media root}/pixabay/{id}.mp3`, the downloaded audio, never committed
- **generated cover** — an SVG `data:` URL drawn from the title and genre with the design-system cover gradients

## Description

The slice lives in the developer tool `Hummi.Cli`, with one pure helper in `Hummi.Application` and small
domain changes. Production code paths of the API and the frontend do not know about Pixabay beyond the
licence and the source link.

**Developer tool — Hummi.Cli**

- **`CliApp`** — Dispatches `import`, `seed` and `reset`. `import` and `seed` read the manifest from `Catalogue:ManifestPath`, else the copy next to the binary; `import` writes it back to `Catalogue:ManifestPath` when set
- **`PixabayManifest`** — Records `ManifestTrack` and `ManifestLicence`; loads and saves indented camel-case JSON
- **`IPixabayWeb`** — Port that fetches a page as text or a file as bytes, null when it cannot. `HttpPixabayWeb` adapts `HttpClient`; tests use a fake
- **`PixabayTrackPage`** — Parses a track page: JSON-LD (`MusicRecording`, `AudioObject`) first, then Open Graph and `music:` meta tags. Reports the fields it could not find. Extracts the licence page's text
- **`PixabayImporter`** — Imports each source in order, refuses non-Pixabay URLs and incomplete pages, accepts only the Pixabay Content License, writes `pixabay/{id}.mp3` and records its size and SHA-256; restores a missing cached file only when its checksum matches
- **`DemoSeeder`** — Seeds one artist per uploader (no model, no description), each track with `Licence.Pixabay`, its source URL, genre from `GenreMatch`, real or generated cover, and copies the audio to `tracks/{trackId}.mp3`; skips a track whose audio is missing or corrupt; adds the demo listeners with likes, follows, playlists and notifications that refer only to seeded tracks
- **`GenreMatch`** — Returns the slug of the fixed genre whose name or slug equals the Pixabay genre or a tag, case-insensitively, with the aliases "steel drum", "steel drums", "steel pan", "steelpan", "calypso" for Steelpan & Calypso and "children", "kids" for Kids

**Backend — Hummi Application and Domain**

- **`GeneratedCover`** — Static helper in `Application/Catalogue`. `DataUrl(title, tone)` returns a deterministic SVG of 300 × 300 with the tone's gradient, rings placed by a hash of the title and the title's initials, under 2,048 characters
- **`Licence.Pixabay`** — New licence value 4, labelled "Pixabay Content License"
- **`Artist.ModelName`** — Optional; `GetArtistQuery` and `GetTrackQuery` return null when unknown
- **`Track.SourceUrl`, `Track.AudioExtension`** — The Pixabay page of the track and the audio file's extension (`.mp3` for imports, `.wav` for rows created before)

**Frontend — Hummi web application (Angular)**

- **`TrackPage`**, **`LicencePage`**, **`ArtistPage`** — Hide the model when null; the track page adds the Source row; the licence page describes the Pixabay Content License and links to it (view-track, view-licence, view-artist)
- **`HomePage`** — Hides empty shelves and shows "No music yet" when every shelf is empty and nothing is featured (view-home)

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is in `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-056` | `L1-014` | **Import tracks from Pixabay Music.** Each source page becomes a manifest entry with its real metadata and licence text, and its audio is cached; incomplete or unreachable pages are refused and reported; existing entries are not fetched again; missing audio is restored only when its checksum matches. |
| `L2-057` | `L1-014` | **Seed the catalogue from the manifest.** Exactly the manifest's tracks, one artist per uploader, no albums or plays, genre by exact name or tag, real or generated cover, tracks with missing audio skipped, demo listeners referring only to seeded tracks, idempotent. |
| `L2-058` | `L1-014` | **Screens with a small catalogue.** Every screen works with no tracks, one track or a few. |
| `L2-012` | `L1-003` | **Licence and credit page.** Describes the Pixabay Content License and links to it and to the track's Pixabay page. |

## Diagrams

### System context

A developer runs the Hummi tool; it reads track pages and audio from Pixabay Music.

![C4 system context for import the Pixabay catalogue](diagrams/c4-context.png)

### Containers

`Hummi.Cli` reads and writes the manifest, writes audio to the media volume and inserts the catalogue; the API
then serves it as before.

![C4 container view for import the Pixabay catalogue](diagrams/c4-container.png)

### Components

`PixabayImporter` uses the `IPixabayWeb` port and the `PixabayTrackPage` parser; `DemoSeeder` reads the
manifest and uses `GenreMatch` and `GeneratedCover`.

![C4 component view for import the Pixabay catalogue](diagrams/c4-component.png)

### Class structure

The manifest owns its tracks and each track its licence; the seeder maps a manifest track to domain entities.

![Class diagram for import the Pixabay catalogue](diagrams/class-structure.png)

### Behaviour — import a Pixabay track

![Sequence diagram for import a Pixabay track](diagrams/sequence-import.png)

### Behaviour — seed the catalogue from the manifest

![Sequence diagram for seed the catalogue](diagrams/sequence-seed.png)

## Open questions

- **Page format not verified.** `pixabay.com` was denied by the network policy of the session that built this
  feature, so `PixabayTrackPage` is tested only against fixtures following schema.org JSON-LD and Open Graph.
  The first real `hummi import` must be checked, and the parser adjusted if Pixabay's markup differs.
- **Standalone redistribution.** The Pixabay Content License forbids redistributing content unaltered on a
  standalone basis; whether streaming in Hummi counts must be cleared before a production catalogue (ADR 0021).
- **Waveforms.** Imported tracks have no waveform peaks until an MP3 decoder is added.

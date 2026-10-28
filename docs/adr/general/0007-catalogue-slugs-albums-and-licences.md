# 0007. Catalogue pages address tracks, artists and albums by slug; albums and licences live on the track

Status: Accepted (2026-10-27)

Amended by ADR 0021: the catalogue is real Pixabay music with the Pixabay Content License and no albums; the Creative Commons licences remain valid values.

## Context

Journey 04 (explore catalogue pages) adds the track, artist, album and licence pages (L2-008 to L2-012)
and the Not found page (L2-044). Their routes use readable segments (`/tracks/feathers-up`,
`/albums/mas-on-the-avenue`), but tracks were only known by GUID, and there were no albums, licences,
models, descriptions, waveforms or monthly listener counts. The designs left the listener-count schedule,
the Popular length and the album minute rounding open, and modelled album membership as a separate
`AlbumTrack` entity. L2-008 gave the Feathers Up overline as "4:12" though the track is 3:42, and L2-011
gave the Mas on the Avenue album the slug `night-garden`; both examples were corrected in `L2.md`.

## Decision

- `Track`, `Artist` and `Album` each carry a unique `Slug`, derived from the title or name when created
  (`Slug.From`: lowercase letters and digits joined by hyphens; apostrophes join). The API serves
  `GET /api/tracks/{slug}`, `/api/artists/{slug}` and `/api/albums/{slug}`; streams and play recording
  keep using the track id. `TrackSummaryDto` gains `slug`, and every track link uses it.
- `Track.Licence` is a non-nullable enum of exactly three values (CC0 1.0, CC BY 4.0, CC BY-SA 4.0);
  `LicenceLabels` names them for the pages. The licence page's comparison table and credit wording are
  static constants (`LICENCE_TERMS`) in `@hummi/catalogue`.
- The open-weights model belongs to the artist (`Artist.ModelName`); "Generated with" shows it.
- A track joins an album through `AlbumId` and `AlbumPosition`. `Album.Publish(tracks)` requires at least
  one of its own tracks; only published albums are found or listed. The summary rounds total minutes up and
  names the licence the tracks share, or "mixed licences".
- `Track.Waveform` stores 64 peaks from 0 to 100 in the track row; no separate waveform file.
- `MonthlyListenersJob` in `Hummi.Worker` sends `RefreshMonthlyListenersCommand` at start-up and hourly.
  It counts distinct signed-in listeners of the last 30 days; anonymous plays are not counted.
- Popular lists 5 tracks; More from and Similar tracks list up to 6, most played first. Similar means the
  same genre.
- An unknown slug answers 404; the catalogue page renders the Not found composition (`hm-error-page` with
  `NOT_FOUND`) in place, and the unknown route uses the same composition.
- The pages live in a new `@hummi/catalogue` feature library. Like, Add to playlist, Share, Report and
  Follow render now and open their dialogs or act when the library, sharing and reporting journeys land.

## Consequences

- Two tracks with the same title need an explicit slug; the unique index rejects a duplicate.
- The `AddCataloguePages` migration backfills existing tracks and artists with their id as slug, CC0 and
  the default model.
- Monthly listener counts start at zero on a fresh install and grow only with signed-in plays.
- "Search Hummi" on the Not found page links to `/search`, which the search journey provides.

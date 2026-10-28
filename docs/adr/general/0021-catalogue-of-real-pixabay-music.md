# 0021. The catalogue is real Pixabay music, imported into a committed manifest

Status: Accepted (2026-10-28)

## Context

Until now `Hummi.Cli seed` wrote an invented catalogue: 18 made-up tracks by 14 made-up artists, made-up
albums, descriptions, licences and open-weights model names, a generated WAV per track and cover images from
a stock CDN that did not belong to the tracks. The product owner asked that every track in the app be a real
track from <https://pixabay.com/music/>, described only by what its Pixabay page says, with its real audio and
cover, and that the catalogue hold exactly as many tracks as could be obtained, with no padding.

Pixabay music has no albums, no open-weights model, no artist description and one licence, the Pixabay
Content License. The fixed genre list of ADR 0006 does not match Pixabay's genres.

## Decision

- **Source.** The only source of tracks is a Pixabay music track page (`https://pixabay.com/music/{slug}-{id}/`).
  Uploads by users, streaming from Pixabay and any non-Pixabay source stay deferred.
- **Manifest.** `src/backend/Hummi.Cli/Catalogue/pixabay-manifest.json` is the source of truth of the
  catalogue. `sources` lists the track pages to import; `tracks` holds one entry per imported track: Pixabay id,
  source URL, title, artist (the uploader) and their profile URL, duration, Pixabay genre and tags, audio URL,
  file name, size and SHA-256, cover URL (or none) and the licence's name, URL and text as the page gives them,
  plus when it was imported.
- **Importer.** `hummi import` fetches each source page through the `IPixabayWeb` port, reads its metadata from
  the page's JSON-LD and Open Graph tags (`PixabayTrackPage`), fetches the licence page the track links to, and
  downloads the audio into the media cache `pixabay/{id}.mp3`. pixabay.com answers plain requests with a bot
  check, which the importer never tries to get past: `hummi import --pages {folder}` reads the track pages
  (`{id}.html`) and the licence summary (`license-summary.html`) saved from a normal browser, and still downloads
  the audio from `cdn.pixabay.com`. A page that lacks a title, artist, duration, audio
  file or the Pixabay Content License is refused and reported; nothing is filled in. A track already in the
  manifest is not fetched again; its audio is downloaded again, and checked against its SHA-256, when the cache
  lacks it.
- **Audio is not committed.** The repository keeps code and docs only; Pixabay MP3s are several MB each. The
  manifest carries each file's URL and SHA-256, so `hummi import` restores the media cache from it.
- **Seeding.** `hummi seed` builds the catalogue from the manifest only: one artist per uploader, no albums
  (none exist on Pixabay), the Pixabay licence, the genre of ADR 0006 whose name or slug equals the Pixabay genre
  or one of its tags (else unclassified), and the audio copied from the media cache to `tracks/{id}.mp3`. A
  track whose cached audio is missing or fails its checksum is skipped and reported. Plays are not invented: the
  Top 10 starts at zero plays and orders by title until listeners play.
- **Demo listener.** Nadia Charles likes and keeps in her playlist the first three tracks of the manifest (or
  fewer), follows their artists, and gets a new-release notification only when a track exists. Mei's public
  playlist holds the first four tracks or fewer. With no tracks, both listeners exist with empty libraries.
- **Licence.** `Licence.Pixabay` (4) is added; CC0, CC BY and CC BY-SA keep their numbers, which are never
  reused, but no track carries them. The licence page describes the Pixabay Content License as its summary page
  does and links to it; the track page links to the track's Pixabay page.
- **Model.** `Artist.ModelName` becomes optional. Pixabay pages name no model, so the track page, artist page and
  credit line leave it out when it is unknown.
- **Cover art.** The cover is the image the Pixabay page gives the track (the JSON-LD `thumbnailUrl` or image,
  else `og:image`), shown from Pixabay's CDN, and only when it lies under `cdn.pixabay.com/audio/`: a page whose
  track has no cover of its own still carries a generic gradient as `og:image`, which is never taken. A track without one gets a generated SVG cover (`GeneratedCover`), deterministic from
  its title and genre and drawn with the cover gradients of the design tokens, stored as a `data:` URL.
- **Small catalogues.** Home hides a shelf that has no tracks and, with no tracks at all, shows "No music yet".
  Every other screen already had an empty state.

## Deferred

- Uploading by users, streaming from Pixabay itself and any non-Pixabay source.
- Committing audio: Pixabay MP3s are several MB each, beyond the repository's size norms. The manifest is the
  source of truth and `hummi import` restores the audio from it.

## Consequences

- When this ADR was written the session's network policy denied `pixabay.com`, so no page could be read. On
  2026-10-28 the reader was checked against real pages and three differences were fixed test-first, with fixtures
  trimmed from those pages: the JSON-LD name is "{title} by {artist} | Royalty-free Music" (the title keeps a bar
  of its own, as in "Dance Like Usyk | Soca|Suno Music Show YouTube"); a track without its own cover has a generic
  gradient as `og:image`; and the licence summary has no `main`, so its cookie-consent panel leaked into the text.
- Plain requests to pixabay.com pages get a Cloudflare challenge, from a cloud session and from a developer's
  machine alike, while `cdn.pixabay.com` serves audio and covers; hence `--pages`.
- The committed manifest lists five real track pages under `sources`, one of them ("Dreaming Of Reggae",
  217732) without a cover of its own, and no `tracks` yet: no real track has been imported. A fresh install has
  an empty catalogue until the pages are saved and `hummi import --pages` runs on a developer's machine.
- The Pixabay Content License forbids redistributing content on a standalone basis. Streaming unmodified tracks
  may count as such use; the owner must clear this before a production catalogue is published. Local and demo
  installs only, until then.
- Waveforms stay empty for imported tracks (no MP3 decoder); the waveform draws flat until one is added.
- The product framing of "AI-generated music" no longer holds for the catalogue; the copy names Pixabay instead
  of a model where a model was shown.

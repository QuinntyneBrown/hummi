# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A catalogue made only of real Pixabay Music tracks (ADR 0021): `hummi import` reads Pixabay track pages into the committed manifest `Hummi.Cli/Catalogue/pixabay-manifest.json` with their metadata, licence text and audio checksum; `hummi seed` writes exactly those tracks; covers are the real Pixabay images or a generated cover from the title and genre.
- The Pixabay Content License: the licence page describes it and links to it and to the track's Pixabay page; the track page shows a Source link.
- Screens that work with no tracks, one track or a few: Home hides empty shelves and shows "No music yet" when the catalogue is empty.
- `hummi import --pages {folder}` imports from Pixabay pages saved in a browser, because pixabay.com answers plain requests with a bot check; the audio still downloads from Pixabay's CDN.
- The catalogue: 11 real Pixabay tracks imported and checked against their pages, 7 of them Soca; three without a cover of their own get a generated cover.

### Fixed

- https://www.hummi.fm and https://hummi.fm failed to connect although DNS pointed at the VM: Caddy only held a certificate for the Azure `*.cloudapp.azure.com` name. The deploy workflow now derives the served hosts, the canonical `www.` host and `App__BaseUrl` from the `SITE_HOST` secret, Caddy redirects the bare domain to `www.`, and the smoke test checks the canonical host and the redirect. Setting `SITE_HOST` to `hummi.fm` and deploying brings the domain up (`docs/deployment.md`, "Moving to a custom domain").
- The library and playlists on SQL Server: ids built in database queries were upper-case text, so liked tracks and playlist entries did not match and the library failed to load.
- The Pixabay page reader, checked against real pages: titles no longer end in " by {artist} | Royalty-free Music", a generic gradient is never taken as a track's cover (a cover is generated instead), and the licence text no longer includes the site's cookie-consent panel.

### Removed

- The invented demo catalogue (18 tracks, 14 artists, albums, descriptions, licences, model names, generated WAV audio and stock CDN covers).

- Project scaffold: .NET backend solution, Angular workspace, CI and deploy workflows, documentation structure and agent skills.

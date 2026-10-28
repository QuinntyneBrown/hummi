# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- A catalogue made only of real Pixabay Music tracks (ADR 0021): `hummi import` reads Pixabay track pages into the committed manifest `Hummi.Cli/Catalogue/pixabay-manifest.json` with their metadata, licence text and audio checksum; `hummi seed` writes exactly those tracks; covers are the real Pixabay images or a generated cover from the title and genre.
- The Pixabay Content License: the licence page describes it and links to it and to the track's Pixabay page; the track page shows a Source link.
- Screens that work with no tracks, one track or a few: Home hides empty shelves and shows "No music yet" when the catalogue is empty.

### Removed

- The invented demo catalogue (18 tracks, 14 artists, albums, descriptions, licences, model names, generated WAV audio and stock CDN covers).

- Project scaffold: .NET backend solution, Angular workspace, CI and deploy workflows, documentation structure and agent skills.

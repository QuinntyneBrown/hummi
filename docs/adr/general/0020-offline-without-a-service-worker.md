# 0020. Offline listening works from the running app: saved answers, saved audio, preloaded pages

Status: Accepted (2026-10-27)

## Context

Journey 17 builds L2-043. The `system-feedback/work-offline` design named the Angular service worker with an
asset group and API data groups. `@angular/service-worker` is not a dependency, and a service worker's own
requests would bypass the Playwright `page.route` fakes every e2e test relies on (AGENTS.md). Which tracks are
saved and how many were `<TO SUPPLY>`. L2-041 AC4 needs a Downloads toast while L2-043 AC4 forbids a download
option.

## Decision

- **Pages.** `offlineInterceptor` in `@hummi/api` keeps the answers of page requests (track, artist, album,
  genre, playlist, Library, Notifications, Settings) in `localStorage`, the newest 60. Offline, a page request
  is answered from there, so the page shows with the offline banner (L2-043 AC1); with no saved answer, the
  Offline page replaces the page and keeps its address (AC3). Retry opens it again; Open saved tracks opens
  `/saved`. Home keeps its own saved shelves (ADR 0015).
- **Code.** The router preloads every lazy page after start (`PreloadAllModules`), so pages open from the
  running app with no network.
- **Audio.** `SavedAudioCache` keeps the audio of every track that starts playing online in Cache Storage
  (`hummi-audio-v1`), the 25 most recently played. Offline, `PlayerStore` plays a saved track from there and,
  for any other, stays paused with the toast "“{title}” needs a connection to play" (AC2). `/saved` ("Saved on
  this device") lists them; it has a new mock.
- **No download option.** Saving is automatic; no control offers to download a track (AC4). The first save on
  a device shows the toast "Downloads are saved for offline listening on this device" once (L2-041 AC4).
- **Cold start.** Opening Hummi with no connection and nothing loaded is not covered: it needs a service
  worker for the app shell, deferred until it can run alongside the e2e fakes.

## Consequences

- `localStorage` holds up to 60 page answers; Cache Storage up to 25 tracks of audio.
- A reload while offline fails like any website without a service worker.

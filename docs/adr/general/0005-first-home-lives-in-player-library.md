# 0005. The first Home lives in the player library and lists the Top 10 as rows

Status: Accepted (2026-10-27)

## Context

Journey 02 (play a track without an account) needs a page with tracks to play before the personal Home of
journey 12 exists. `discovery/view-home` places the personal Home in `@hummi/discovery` with one endpoint per
shelf. L2-005 says track lists appear on Home, but the Home mock showed the Top 10 as cards only.

## Decision

- Until journey 12, Home (`/`) is a non-personal page in the `@hummi/player` feature library. It shows the
  "Recently added" shelf of track cards and the "Top 10 on Hummi this week" as a numbered track list, both
  from one `GET /api/home` call. Journey 12 moves Home to `@hummi/discovery` and splits the endpoint per shelf.
- The Home mock renders the Top 10 as a track list (`hm-track-list`), so Home exercises L2-005.
- A play counts as soon as playback starts; the browser posts `POST /api/plays` once per track start,
  signed in or not.
- Audio is read from the media volume (`Media:Root`, `tracks/{trackId}.{ext}`) behind the `IMediaStore` port
  and streamed by byte range.

## Consequences

- The billboard and genre shelves in the Home mock are built by later journeys (03 and 12).
- Journey 12 must move `HomeComponent` and its route out of `@hummi/player`.

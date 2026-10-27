# Show Now playing

## Overview

Now playing (`/now-playing`) is the full-screen view of the current track. It shows a large cover,
the title with links to artist and album, a waveform with elapsed and total time, and the full set of
controls including Shuffle and Repeat. It also offers Add to playlist, Share and Queue.

- **shuffle mode** — player mode in which the remaining queue plays in random order
- **repeat mode** — player mode in which the queue restarts after its last track <TO SUPPLY: repeat-one support>
- **resume position** — playback position saved when the connection drops, used to resume once online

Now playing has no data of its own; it renders `PlayerStore`. The player bar is hidden on this page.

## Description

The slice is frontend-only apart from the waveform peaks file served from the media volume.

**Frontend — Hummi web application (Angular)**

- **`NowPlayingPage`** — Routed component in @hummi/player. Renders `hm-cover`, title and links, `hm-waveform`, the transport `hm-icon-button` set with Shuffle and Repeat as `aria-pressed` toggles, and the empty and danger states
- **`PlayerStore`** — Signal store in @hummi/api. Owns the queue, the current track, position and play state, and drives the `HTMLAudioElement`
- **`HTMLAudioElement`** — Browser media element. Requests audio by byte range and reports `timeupdate`, `ended`, `stalled` and `error`
- **`ConnectivityService`** — Service in @hummi/api. Exposes `online` as a signal from `navigator.onLine` and `online`/`offline` events

**Backend — Hummi.Api application**

- **`MediaController`** — ASP.NET Core controller. `GET /media/tracks/{id}/peaks.json` returns waveform peaks

**Backend — Hummi Infrastructure**

- **`media volume`** — Docker volume /data/media. Holds audio and peaks files

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-015` | `L1-004` | **Now playing.** 1. Given a track is playing, when the listener opens Now playing (`/now-playing`), then it shows the large cover, the title, links to the artist and album, a waveform with elapsed and total time, and the controls "Shuffle", "Previous track", "Pause", "Next track" and "Repeat".<br>2. Given "Shuffle" or "Repeat", when activated, then its pressed state toggles and playback order or repetition follows it.<br>3. Given playback is paused, when Now playing renders, then the main control reads "Play".<br>4. Given Now playing, when it renders, then it shows "Add to playlist", "Share" and "Queue" buttons, the last opening the Queue page.<br>5. Given nothing is playing, when Now playing opens, then it shows "Nothing is playing" with "Press play on any track and it shows up here with the waveform and queue." and a "Browse genres" button.<br>6. Given the connection drops while streaming, when Now playing renders, then a danger alert reads "Playback stopped" with "We lost the connection while streaming {title}. We’ll resume from {position} once you’re back online.", and playback resumes from that position when the connection returns. |

## Diagrams

### System context

A listener views and controls the current track in Hummi. No external system takes part.

![C4 system context for show now playing](diagrams/c4-context.png)

### Containers

Now playing reads waveform peaks through `web` from `Hummi.Api`, which reads them from the media volume.

![C4 container view for show now playing](diagrams/c4-container.png)

### Components

`NowPlayingPage` reads and commands `PlayerStore`, which watches `ConnectivityService`; `MediaController` serves peaks.

![C4 component view for show now playing](diagrams/c4-component.png)

### Class structure

`NowPlayingPage` depends on `PlayerStore`, which adds shuffle, repeat and resume state and listens to `ConnectivityService`.

![Class diagram for show now playing](diagrams/class-structure.png)

### Behaviour — open Now playing and recover from a dropped connection

The page renders `PlayerStore` state. On a stream error while offline, the store saves the resume position and resumes from it when `ConnectivityService` reports the connection back.

![Sequence diagram for open Now playing and recover from a dropped connection](diagrams/sequence-now-playing.png)

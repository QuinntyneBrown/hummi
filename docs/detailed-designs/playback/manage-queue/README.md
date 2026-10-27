# Manage the queue

## Overview

The queue is the ordered list of tracks that play after the current one. The Queue page (`/queue`)
shows the current track under "Now playing" and the rest under "Next up" with the upcoming count and
duration. A listener adds a single track from any row's More actions, or clears all upcoming tracks.

For a signed-in listener the queue is part of the account (`L2-032` states that "your queue" lives
there), so `PlayerStore` saves it to the server and restores it on another device. A signed-out
listener's queue lives only in the browser.

- **next up** — queue entries after the current index
- **play next** — insertion directly after the current index

## Description

The queue is browser state mirrored to the server for signed-in listeners.

**Frontend — Hummi web application (Angular)**

- **`QueuePage`** — Routed component in @hummi/player. Renders the Now playing section, Next up `hm-track-list`, Clear queue and the empty state
- **`TrackActionsMenu`** — `hm-menu` content in @hummi/components. Offers Add to queue among row actions
- **`PlayerStore`** — Signal store in @hummi/api. Owns the queue, the current track, position and play state, and drives the `HTMLAudioElement`
- **`ToastService`** — Service in @hummi/components. Queues `hm-toast` notifications in the toast region (`L2-041`)
- **`SessionStore`** — Signal store in @hummi/api. Holds the signed-in listener, the access token and the signed-in/signed-out state the shell reads
- **`QueueApi`** — Typed HTTP service in @hummi/api. `GET` and `PUT /api/me/queue`

**Backend — Hummi.Api application**

- **`QueueController`** — ASP.NET Core controller. Authorized `/api/me/queue` endpoints

**Backend — Hummi Application and Domain**

- **`SaveQueueCommandHandler`** — MediatR command handler. Replaces the listener's stored queue (track ids and current index). Maximum length: <TO SUPPLY>

**Backend — Hummi Infrastructure**

- **`HummiDbContext`** — EF Core DbContext. Implements the `IHummiDbContext` port from `Application/Abstractions` and maps entities to tables
- **`Hummi database`** — Azure SQL. Saved queues

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-016` | `L1-004` | **Queue.** 1. Given a queue, when the listener opens Queue (`/queue`), then it shows a "Now playing" section with the current track and a "Next up" list, and the subtitle shows the upcoming count and duration (e.g. "4 tracks · 14 min").<br>2. Given a non-empty queue, when the listener activates "Clear queue", then the "Next up" list is emptied.<br>3. Given an empty queue, when Queue opens, then it shows "Your queue is empty" with "Add tracks with More actions, or start a playlist and the rest will line up here." and an "Open library" button.<br>4. Given a track's "More actions", when the listener adds it to the queue, then the info toast "Added to queue" with "“{title}” plays after the current track." is shown (L2-041) and the track plays after the current one. |

## Diagrams

### System context

A listener manages what plays next in Hummi. No external system takes part.

![C4 system context for manage the queue](diagrams/c4-context.png)

### Containers

The Angular application is delivered by the `web` container, which also proxies `/api` to `Hummi.Api`; the API reads and writes the Hummi database through EF Core.

![C4 container view for manage the queue](diagrams/c4-container.png)

### Components

`TrackActionsMenu` and `QueuePage` call `PlayerStore`, which calls `QueueApi` when signed in; `QueueController` sends `SaveQueueCommand`.

![C4 component view for manage the queue](diagrams/c4-component.png)

### Class structure

`PlayerStore` computes `upNext` and its duration. `SaveQueueCommandHandler` upserts one `SavedQueue` per listener.

![Class diagram for manage the queue](diagrams/class-structure.png)

### Behaviour — add to queue and clear it

Queue edits change `PlayerStore` first and confirm with a toast; for a signed-in listener the store then saves the queue with `SaveQueueCommand`.

![Sequence diagram for add to queue and clear it](diagrams/sequence-queue.png)

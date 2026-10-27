# Share a link

## Overview

The sharing subsystem lets a listener send a track or playlist to anyone. Sharing produces a short
link of the form `https://hummi.example/s/{code}` that opens without an account. The link grants
listening only; nobody who opens it can change the shared item.

- **share link** — stable URL that identifies one track or playlist by a short random code
- **share code** — 8 characters from `23456789abcdefghjkmnpqrstuvwxyz` (no look-alikes), drawn with `RandomNumberGenerator` (ADR 0014)

One code exists per item and is reused on every share, so repeated sharing does not mint new links.
Sharing a private playlist grants read access through the link.

## Description

The dialog asks the API for the item's link, creating it on first use, and copies it with the Clipboard API.

**Frontend — Hummi web application (Angular)**

- **`ShareDialog`** — Dialog component in @hummi/sharing, opened through `ShareDialogs` and rendered by the shell. Renders `hm-share-sheet`: Link and Embed tabs, Copy, Start at and the send targets; announces copy status in a live region
- **`Clipboard`** — `navigator.clipboard` in `hm-share-sheet`. Writes text to the system clipboard
- **`SharesApi`** — Typed HTTP service in @hummi/api. Calls `POST /api/shares`; `ShareDialogs` holds the open dialog
- **`ToastService`** — Service in @hummi/components. Shows the danger toast when no link could be made

**Backend — Hummi.Api application**

- **`SharesController`** — ASP.NET Core controller. `POST /api/shares` returns the link for `{type, id}`; anonymous callers may share public items

**Backend — Hummi Application and Domain**

- **`GetOrCreateShareLinkCommandHandler`** — MediatR command handler. Returns the existing `ShareLink` or creates one with a fresh code; refuses private playlists of other owners
- **`ShareLink.NewCode`** — Domain. Generates cryptographically random codes; a clash draws again

**Backend — Hummi Infrastructure**

- **`HummiDbContext`** — EF Core DbContext. Implements the `IHummiDbContext` port from `Application/Abstractions` and maps entities to tables
- **`Hummi database`** — Azure SQL. Share links, unique on Code and on (TargetType, TargetId)

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-025` | `L1-006` | **Share dialog.** 1. Given a track or playlist, when the listener activates "Share", then the dialog "Share {name}" shows the cover, "Free for anyone to play — no account needed.", the tabs "Link" (selected) and "Embed" (tracks only), a link field in the format `hummi.fm/s/{code}` with a "Copy" button, and a "Send it straight to" row with "WhatsApp", "Email" and "Messages".<br>2. Given "Copy", when activated, then the link is copied to the clipboard and the button reads "Copied" for a short moment before reading "Copy" again.<br>3. Given the "Embed" tab, when selected, then it shows a preview card of the track and the embed code `<iframe src="https://hummi.fm/embed/{slug}" width="100%" height="96" frameborder="0"></iframe>` with its own "Copy" button.<br>4. Given the shared track is the current track and has played for more than zero seconds, when the dialog renders, then a "Start at {m:ss}" checkbox is offered, and when checked the link carries the start time.<br>5. Given anyone opens a shared link, when they are not the owner, then they can listen but cannot change the shared item. |

## Diagrams

### System context

A listener shares a track or playlist link from Hummi. Recipients use the link outside the product.

![C4 system context for share a link](diagrams/c4-context.png)

### Containers

The Angular application is delivered by the `web` container, which also proxies `/api` to `Hummi.Api`; the API reads and writes the Hummi database through EF Core.

![C4 container view for share a link](diagrams/c4-container.png)

### Components

`ShareDialog` calls `SharesApi` and the CDK `Clipboard`; `SharesController` sends `GetOrCreateShareLinkCommand`, which uses `IShareCodeGenerator`.

![C4 component view for share a link](diagrams/c4-component.png)

### Class structure

`ShareLink` maps a code to a `ShareTargetType` and target id. The handler finds or creates it through `IShareCodeGenerator`.

![Class diagram for share a link](diagrams/class-structure.png)

### Behaviour — share and copy a link

The handler reuses an existing link for the target or creates one with a random code. Copy writes to the clipboard and announces the status; copies outside the dialog confirm with a toast.

![Sequence diagram for share and copy a link](diagrams/sequence-share.png)

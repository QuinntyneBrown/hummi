# Use keyboard shortcuts

## Overview

Keyboard shortcuts let a listener control playback without a pointer. They work while the page has
focus and no text field does, so typing in search or a form never triggers them. The "?" key opens a
dialog that lists them.

| Key | Action |
|-----|--------|
| Space | Play or pause |
| → / ← | Next or previous track |
| L | Like the current track |
| Q | Open the queue |
| / | Focus search |
| ? | Open Keyboard shortcuts |

- **text field** — focused `input`, `textarea`, `select` or element with `contenteditable`

## Description

The slice is frontend-only; Like reuses the library subsystem's like command.

**Frontend — Hummi web application (Angular)**

- **`ShortcutService`** — Service in the hummi application. Listens to `keydown` on `document`, ignores events whose target is a text field or that carry Ctrl, Alt or Meta, and dispatches the mapped action
- **`PlayerStore`** — Signal store in @hummi/api. Owns the queue, the current track, position and play state, and drives the `HTMLAudioElement`
- **`DialogService`** — Service in @hummi/components. Opens `hm-dialog` components as modal overlays and returns a typed close result (`L2-047`)
- **`LibraryApi`** — Typed HTTP service in @hummi/api. `PUT /api/me/likes/{trackId}` (`L2-018`)
- **`Router`** — Angular router. Navigates to `/queue`
- **`ShortcutsDialogComponent`** — Dialog content in the hummi application. Renders `hm-dialog` with `hm-kbd` rows and Close

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-017` | `L1-004` | **Keyboard shortcuts.** 1. Given the page is focused and no text field is, when the listener presses Space, then playback toggles between play and pause.<br>2. Given the same condition, when they press → or ←, then the next or previous track plays.<br>3. Given the same condition, when they press L, then the current track is liked; Q opens the queue; / focuses search; ? opens the "Keyboard shortcuts" dialog.<br>4. Given a text field has focus, when any of these keys is pressed, then the key types into the field and no shortcut fires.<br>5. Given the "Keyboard shortcuts" dialog, when it opens, then it reads "Work while the page is focused and no text field is." and lists the six shortcuts above with a "Close" button. |

## Diagrams

### System context

A listener controls Hummi with the keyboard. No external system takes part.

![C4 system context for use keyboard shortcuts](diagrams/c4-context.png)

### Containers

Shortcuts run in the Angular application; only Like reaches `Hummi.Api`.

![C4 container view for use keyboard shortcuts](diagrams/c4-container.png)

### Components

`ShortcutService` dispatches to `PlayerStore`, `LibraryApi`, the router and `DialogService`.

![C4 component view for use keyboard shortcuts](diagrams/c4-component.png)

### Class structure

`ShortcutService` composes six `ShortcutBinding` entries that `ShortcutsDialogComponent` also lists, so the dialog cannot drift from the bindings.

![Class diagram for use keyboard shortcuts](diagrams/class-structure.png)

### Behaviour — press a shortcut

`ShortcutService` filters out text-field targets first, then dispatches each key to the store, router or dialog service.

![Sequence diagram for press a shortcut](diagrams/sequence-shortcuts.png)

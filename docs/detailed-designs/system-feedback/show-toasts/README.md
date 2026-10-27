# Show toasts

## Overview

A toast is a short message that confirms or reports the result of an action without interrupting the
listener. Toasts appear in a stack; info, success and warning toasts dismiss themselves after 8 seconds,
and danger toasts stay until dismissed. Toasts may carry Undo or Retry.

- **toast region** — fixed container holding the stack, a polite live region
- **toast action** — optional button that calls back into the feature that raised the toast

The feature is frontend-only.

## Description

One service owns the stack; features pass a callback for the action.

**Frontend — Hummi web application (Angular)**

- **`Feature component`** — Any feature library. Calls `ToastService.show(...)` after an action
- **`ToastService`** — Service in @hummi/components. Queues `hm-toast` notifications in the toast region (`L2-041`)
- **`ToastRegionComponent`** — `hm-toast-region` in @hummi/components. Renders at most 3 `hm-toast` and a "+{n} more" collapse, newest at the bottom
- **`ToastTimer`** — Class in @hummi/components. Counts down 8 s; pauses on `mouseenter`/`focusin` and resumes on leave

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-041` | `L1-011` | **Toasts.** 1. Given an action completes, when a toast appears, then it shows an icon, a title, a text, an optional action button and a "Dismiss" button, in a polite live region.<br>2. Given an info, success or warning toast, when 8 seconds pass, then it dismisses itself; the timer pauses while the toast is hovered or focused.<br>3. Given a danger toast, when it appears, then it is announced as an alert and stays until dismissed.<br>4. Given more than 3 toasts, when they stack, then the newest is at the bottom, at most 3 are visible and the older ones collapse into "+{n} more".<br>5. Given a toast with "Undo", when activated, then the action it reports is reverted; given "Retry", when activated, then the failed action is attempted again. |

## Diagrams

### System context

Any listener sees toasts after actions in Hummi. No external system takes part.

![C4 system context for show toasts](diagrams/c4-context.png)

### Containers

Toasts run entirely in the Angular application.

![C4 container view for show toasts](diagrams/c4-container.png)

### Components

Features call `ToastService`, which feeds `ToastRegionComponent` and a `ToastTimer` per toast.

![C4 component view for show toasts](diagrams/c4-component.png)

### Class structure

`ToastService` composes `Toast` items with an optional `ToastAction`; non-danger toasts get a `ToastTimer`.

![Class diagram for show toasts](diagrams/class-structure.png)

### Behaviour — raise, pause and act on a toast

Toast timing lives in `ToastTimer`, which pauses while the toast is hovered or focused. The action is a callback into the feature, so Undo and Retry reuse that feature's own command.

![Sequence diagram for raise, pause and act on a toast](diagrams/sequence-toast.png)

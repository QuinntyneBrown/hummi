# Adapt the shell to the viewport

## Overview

The shell is the frame around every page: a sticky header with the primary navigation, the content and
the player bar. On wide viewports the header shows the links Home, Soca, Kids, Steelpan and Your library
beside the logo; on narrow viewports they hide behind an "Open navigation" button. Shelves, track lists
and the player bar reflow so the page never scrolls horizontally (ADR 0004 replaced the sidebar with this header).

- **narrow viewport** — width below `--layout-breakpoint-lg` (64rem, 1024px) from `docs/design-system/tokens/tokens.css`

## Description

Layout is CSS-driven: the design-system stylesheet hides the links and shows the toggle below the breakpoint, so no breakpoint signal is needed. One signal holds whether the narrow menu is open.

**Frontend — Hummi web application (Angular)**

- **`ShellComponent`** — Shell component in the hummi application. Skip link, `hm-top-nav`, main and `hm-player-bar`; holds `navOpen` and closes it on navigation
- **`TopNavComponent`** — `hm-top-nav` in @hummi/components. Brand link, primary links (the current one marked `aria-current="page"`), the "Open navigation" toggle with `aria-expanded`, and an end slot for the search pill and account controls
- **`SessionStore`** — Signal store in @hummi/api. Holds the signed-in listener, the access token and the signed-in/signed-out state the shell reads

## Requirements

The feature realizes the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement in `docs/specs/L1.md`; the text is copied from `docs/specs/L2.md`.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-050` | `L1-012` | **Responsive layout.** 1. Given a wide viewport, when the header renders, then the links Home, Soca, Kids, Steelpan and Your library are visible beside the logo.<br>2. Given a narrow viewport, when the header renders, then the links are hidden and an "Open navigation" button opens them, with its expanded state reflecting whether they are open.<br>3. Given any viewport width, when a page renders, then shelves, track lists and the player bar reflow to fit without horizontal page scrolling; shelves scroll horizontally within themselves. |

## Diagrams

### System context

A listener uses Hummi on any screen size. No external system takes part.

![C4 system context for adapt the shell to the viewport](diagrams/c4-context.png)

### Containers

The layout runs entirely in the Angular application.

![C4 container view for adapt the shell to the viewport](diagrams/c4-container.png)

### Components

`ShellComponent` reads `SessionStore` for the header's end controls and passes `navOpen` to `TopNavComponent`, whose toggle emits `toggle`.

![C4 component view for adapt the shell to the viewport](diagrams/c4-component.png)

### Class structure

`ShellComponent` holds the `navOpen` signal; `TopNavComponent` takes the links and `open` as inputs and emits `toggle`.

![Class diagram for adapt the shell to the viewport](diagrams/class-structure.png)

### Behaviour — render the shell at two widths

CSS switches the header between the visible links and the toggle at 64rem; shelves scroll inside their own track and track rows use `min-width: 0` with ellipsis, so content never forces horizontal page scrolling.

![Sequence diagram for render the shell at two widths](diagrams/sequence-shell.png)

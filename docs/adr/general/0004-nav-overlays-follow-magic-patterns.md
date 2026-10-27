# 0004. Navigation and overlays follow the Magic Patterns design

Status: Accepted (2026-10-27)

## Context
The Hummi Music Branding Magic OS holds "Hummi navigation & overlays" (interactive) and "Hummi nav & overlay board" (twelve labelled states). It extends the home-screen direction in ADR 0003 with the header, player bar, search, Now playing, queue, menus, share dialog and toast.

## Decision
- The header is sticky and goes solid once the page scrolls or leaves Home. It has a search pill, an account avatar and no now-playing chip.
- Search, Now playing and the queue are layers over the current page, not pages. Their screen ids and states stay; the mocks render them over Home.
- A persistent player bar replaces the sidebar player and appears as soon as a track is loaded.
- Two menus are new: the account menu (with a Kids mode switch) and the track menu. Kids mode is new; L1-013 and L2-051 to L2-054 specify them.
- Toasts are a single cream confirmation pill, 4 seconds.
- The signed-in cast member is Nadia Charles, as in the design.

## Consequences
- The toast warning and danger states are marked not applicable; failures use banners and error blocks.
- `docs/design-system/components/*.html`, `docs/design-system/README.md` and `docs/screen-composition.md` still describe the previous chrome and must be regenerated for the new components (header, search pill, player bar, scrubber, search / Now playing / queue layers, menus, share dialog, toast pill).

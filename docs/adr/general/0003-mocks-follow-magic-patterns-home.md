# 0003. Mocks follow the Magic Patterns home screen

Status: Accepted (2026-10-27)

## Context
The "Hummi home screen" design in the Hummi Music Branding Magic OS is the visual direction for the product. The earlier mocks used a left sidebar, a neutral ambient/lo-fi catalogue and a light-first theme.

## Decision
- Every mock follows the home screen: top navigation (Home, genres, Your library, search, avatar, now-playing pill), billboard hero, horizontally scrolling shelves of 188px track cards, outlined top-10 numerals, pill buttons, DM Sans.
- The catalogue is the Caribbean one from that design (Soca, Kids, Steelpan & Calypso), with its generated cover art.
- Dark plum is the default theme. The cream light theme is kept.
- Primary-button text on coral is ink, not cream, to keep WCAG AA contrast (cream on `#f0533a` is about 3.8:1).

## Consequences
Mocks, design-system tokens and components change together. `docs/screen-composition.md` and the component pages in `docs/design-system/components/` must be refreshed to name the new components (top nav, now-playing pill, billboard, shelf, track card, top-10).

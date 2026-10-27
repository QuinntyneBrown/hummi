# 0001. Adopt the Hummi logo board as the brand identity

Date: 2026-10-27

## Status

Accepted

## Context

The frontend shipped with placeholder neutral tokens and a text "Hummi" brand link. A logo
board was designed in Magic Patterns ("Hummi logo board",
https://www.magicpatterns.com/os/qvjokkETC3kGZUXEQhvATw/m7ZHXf98NoqhQdMwpZEGit) with a
monoline wordmark, an icon, app-icon tiles, a light and a dark treatment and a three-colour
palette (coral, cream, plum ink) set in DM Sans.

## Decision

- The board's SVG paths and palette are the source of truth for the brand and live as static
  SVGs in `docs/design-system/assets/` with a README of usage rules. The Magic Patterns React
  code is treated as a spec and is not ported.
- `@hummi/components` owns the mark as `LogoComponent` (`hm-logo`), coloured by tokens so it
  follows the colour scheme; the app shell and feature libraries never inline logo markup.
- `tokens.css` carries the palette. Interactive coral is deepened to `#C4381F` in the light
  scheme so text and focus rings reach WCAG AA on cream; the pure coral `#F0533A` is reserved
  for the mark, the favicon tile and large surfaces (`--color-brand`).
- DM Sans is loaded from Google Fonts in `index.html` with a system sans-serif fallback.
- The favicon is the coral tile, served from `projects/hummi/public/` (registered as the
  application's assets folder in `angular.json`).

## Consequences

- The full design-system extraction (`extracting-design-systems`) must keep these tokens and
  the asset folder rather than regenerate them from mocks.
- Dark mode is supported from day one by the token pair; no component chooses colours directly.
- The Google Fonts request is the only third-party resource the page loads; self-hosting is a
  later option if offline or privacy requirements arise.

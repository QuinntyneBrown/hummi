# @hummi/components

Angular library in the Hummi frontend workspace: the design-system styles and the components every screen is
composed from (see `docs/screen-composition.md`).

- Styles: `src/styles/tokens.css` and `src/styles/components.css` are copies of the design system; `npm run lint`
  fails when they drift (see `src/styles/README.md`).
- Components: `hm-logo`, `hm-skip-link`, `hmButton`, `hm-alert`, `hm-spinner`, `hm-center-state`, `hm-icon`,
  `hm-equalizer`, `hm-skeleton`, `hm-error-block`, `hm-track-row`, `hm-track-list`, `hm-track-card`, `hm-shelf`,
  `hm-top-nav` and `hm-player-bar`. They render design-system class names and hold no data of their own.

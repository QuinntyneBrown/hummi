# Screen composition

Describes how each screen is composed from design-system components. Generated with the `writing-screen-composition` skill once mocks and the design system exist.

## Shell

Mock: every page under `docs/mocks/pages/` (header, main, player bar).

| Part | Library components | Local UI |
|---|---|---|
| Skip link | `hm-skip-link` | None |
| Header | `hm-top-nav` with the brand (`hm-logo`), links Home, Soca, Kids, Steelpan, Your library and the "Open navigation" toggle | End slot: signed out, "Sign in" and "Sign up" links styled with `hmButton`; signed in, the display name |
| Main | None | `main#main.container.app-main` wrapping the router outlet |
| Footer | None | `footer.site-footer` with the two taglines |
| Player bar | `hm-player-bar` (uses `hm-icon`, `hm-equalizer`) | Shown only when a track is loaded and the route has no `data.hidePlayer` |

## Home (`pages/home`)

| Part | Library components | Local UI |
|---|---|---|
| Recently added | `hm-shelf` (rail) of `hm-track-card` | None |
| Top 10 on Hummi this week | `hm-shelf` with `hm-track-list` | None |
| Loading | `hm-shelf` with `hm-skeleton` cards and rows inside an `aria-busy` region | Layout only |
| Error | `hm-error-block` ("We couldn’t load this page") | None |

## Not found (`pages/not-found`)

| Part | Library components | Local UI |
|---|---|---|
| Message | None | Heading and link to Home; route data `hidePlayer: true` |

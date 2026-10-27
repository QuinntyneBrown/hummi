# @hummi/player

Angular feature library in the Hummi frontend workspace: listening screens. Until journey 12 it also
holds Home (`/`), the "Recently added" shelf and the Top 10 list (ADR 0005). It exports its lazy route
table from `src/public-api.ts` (with Now playing at `/now-playing`), and the shell parts `hm-queue-panel` (queue
drawer) and `hm-track-menu-host` (track menu). Playback state lives in `PlayerStore` and `PlayerOverlays` in
`@hummi/api` (ADR 0009).

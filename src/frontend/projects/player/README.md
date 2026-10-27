# @hummi/player

Angular feature library in the Hummi frontend workspace: listening screens. Until journey 12 it also
holds Home (`/`), the "Recently added" shelf and the Top 10 list (ADR 0005). It exports its lazy route
table from `src/public-api.ts`; playback state lives in `PlayerStore` in `@hummi/api`.

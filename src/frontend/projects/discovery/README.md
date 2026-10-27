# @hummi/discovery

Angular feature library in the Hummi frontend workspace: finding music. It holds Browse (`/browse`),
the directory of genres and moods, and the genre pages (`/genres/{slug}`) with their Newest and Most
played sorts, Play all and Shuffle. It exports its lazy route table from `src/public-api.ts`; data
comes from `GenresApi` and playback goes through `PlayerStore`, both in `@hummi/api`.

# @hummi/catalogue

Angular feature library in the Hummi frontend workspace: what Hummi carries. It holds the track
page (`/tracks/{slug}`), the licence and credit page (`/tracks/{slug}/licence`), the artist pages
(`/artists/{slug}`) and the album pages (`/albums/{slug}`). It exports its lazy route table from
`src/public-api.ts`; data comes from `TracksApi`, `ArtistsApi` and `AlbumsApi` and playback goes
through `PlayerStore`, all in `@hummi/api`. An unknown slug renders the Not found page (L2-044).

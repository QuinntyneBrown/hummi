# 0012. Likes and follows are idempotent marks read through one library call

Status: Accepted (2026-10-27)

## Context

Journey 09 builds L2-018 (like tracks, follow artists) and L2-019 (Library). The design named
`PUT/DELETE /api/me/follows/{artistId}`, but the artist page knows the artist by slug only. It left open
how the `liked` and `following` flags of public catalogue responses become per-listener, and neither the
component library nor the mocks had the danger toast L2-018 AC4 asks for, or the Liked and Following tabs.

## Decision

- **Storage.** `TrackLikes` (ListenerId, TrackId, LikedAt) and `ArtistFollows` (ListenerId, ArtistId,
  FollowedAt), keyed by the pair, cascading from the listener and the target. Migration `AddLibraryMarks`.
- **Endpoints.** `PUT` and `DELETE /api/me/likes/{trackId}` and `/api/me/follows/{artistSlug}`, all
  `[Authorize]`, answer 204 and are idempotent; an unknown track or artist answers 404.
  `GET /api/me/library` returns the counts, playlists (empty until journey 10), liked tracks and followed
  artists, newest first.
- **Marks on public pages.** Catalogue, genre, home and search responses stay the same for every visitor
  (their `liked` and `following` flags stay false). `LibraryStore` in `@hummi/api` reads
  `GET /api/me/library` when a listener signs in and on every Library visit, and pages pass track lists
  through `LibraryStore.withLikes`. Library reads afresh on each visit, which meets L2-019 AC5 without push.
- **Optimistic toggles.** `LibraryStore.toggleLike` and `toggleFollow` ask `SignInGate` first, flip the mark,
  send the request and flip back on failure. The failure becomes a danger toast with Retry, which the shell
  shows from `LibraryStore.problem` so `@hummi/api` does not depend on `@hummi/components`. Its titles are
  "Couldn’t like the track", "Couldn’t remove the like", "Couldn’t follow the artist" and "Couldn’t unfollow
  the artist", each with "Check your connection and try again.". Danger toasts stay until dismissed.
- **Track menu.** Save to library likes the track (Remove from library unlikes it) with an Undo pill.
- **UI.** `hm-tabs` and the danger variant of `hm-toast-region` join `@hummi/components`; the mocks gain the
  Library `liked` and `following` states and the toast `danger` state. Playlist and artist tiles use
  `hm-media-tile`. New playlist and Create a playlist only ask `SignInGate` until journey 10.

## Consequences

- One extra request per sign-in and per Library visit; public responses remain cacheable.
- Until the library has loaded, track lists show the flags the server sent.

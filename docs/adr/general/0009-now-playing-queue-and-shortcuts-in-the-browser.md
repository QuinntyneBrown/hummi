# 0009. Now playing, the queue drawer and keyboard shortcuts run in the browser over one PlayerStore

Status: Accepted (2026-10-27)

## Context

Journey 06 (control what plays next) builds L2-015, L2-016 and L2-017. The journey prompt and the three
detailed designs were written from older requirements: a Queue page at `/queue` with "Clear queue" and
an "Added to queue" info toast, a waveform with peaks from `GET /media/tracks/{id}/peaks.json`, an
"Add to playlist" button on Now playing, Q navigating to `/queue`, and a server-side `SavedQueue` for
signed-in listeners. `docs/specs/L2.md` and the mocks have since moved on: Now playing is a full-screen
layer with "Playing from {genre}", a scrubber, Save, Share, Queue, More actions and "Up next"; the queue
is a non-modal drawer with "Then, more {genre}"; the toasts are pills reading "Added “{title}” to your
queue" and "“{title}” will play next". The designs left repeat-one and the saved queue's length open.
There are no accounts yet, so nothing can be saved per listener, and track summaries did not say which
genre a track belongs to.

## Decision

- L2.md and the mocks win. Now playing is the `/now-playing` route in `@hummi/player` rendering
  `hm-player-layer`; Close and Escape go back (to Home when opened directly). The queue is the
  `hm-queue-drawer` shell part, open from the player bar, Now playing and Q. The designs, diagrams and
  screen composition were rewritten to match.
- `TrackSummaryDto` gains `genreSlug` and `genreName` (nullable) through a `Track.Genre` navigation on the
  existing foreign key; no migration. They name "Playing from", "Then, more" and "Go to {genre}".
- Repeat is on or off: after the last track the queue starts again. There is no repeat-one.
- Shuffle reorders the tracks after the current one and remembers the order they came in; turning it
  off restores that order from the current track on.
- "Then, more {genre}" lists up to four of the genre's most played tracks that are not queued. It is
  shown for orientation; the queue does not continue into it.
- The connection drop is detected from the `offline` event as well as stream errors and stalls; the store
  keeps the position and resumes from it on `online` (`ConnectivityService`).
- The shell hosts the queue drawer, the track menu (L2-053, opened from cards, rows, search songs, the
  player bar and Now playing) and the toast region; `PlayerOverlays` in `@hummi/api` holds their state.
  New library components: `hm-scrubber`, `hm-player-layer`, `hm-queue-drawer`, `hm-track-menu`,
  `hm-toast-region` with `ToastService`, and `hm-dialog`.
- `ShortcutService` lives in the hummi application next to the shell. Space on a focused button, link
  or menu item activates that control instead of toggling playback (L2-048); L2-017 AC1 says so now.
- The queue stays in the browser for everyone. Saving it to the account is deferred until accounts exist
  (journey 07 and later); it is not part of any current L2 requirement.
- Save on Now playing, Save to library and Share in the track menu, and the L shortcut render or answer
  now and act when the library (journey 09) and sharing (journey 11) journeys land.

## Consequences

- A reload empties the queue; a signed-in listener's queue does not follow them to another device yet.
- The queue drawer sits under the Now playing layer in the z-order, so Queue (and Q) on Now playing close
  the layer before opening the drawer.
- Every endpoint that lists tracks now also reads the genre row.

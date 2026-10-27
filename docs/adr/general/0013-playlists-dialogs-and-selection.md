# 0013. Playlists: one aggregate, app-wide dialogs and index-based selection

Status: Accepted (2026-10-27)

## Context

Journey 10 builds L2-020 to L2-023. The designs named a FluentValidation validator, the Angular CDK
`SelectionModel`, a `DialogService`, `hm-selection-bar` and `ProblemDetailsMapper`, none of which exist in
the repo. L2-020 AC6 ("Already in this playlist … Add it again?") needs a path where a track is added
without first seeing its membership, and Add to playlist must open from catalogue pages as well as Library.

## Decision

- **Model.** `Playlist` (owner, name, public, created) owns ordered `PlaylistEntry` rows; the same track may
  appear twice. `PlaylistName.Parse` trims and accepts 1 to 60 characters; handlers answer 422 with "Give
  your playlist a name" or "Use up to 60 characters". Migration `AddPlaylists`. Seed: Nadia's private
  "Road trip to the north coast" holds her liked tracks.
- **Endpoints.** `POST /api/playlists` (201, optional `trackIds`), `GET /api/playlists/{id}` (owner, or
  anyone for a public playlist; a private one of someone else is 403), `PUT` and `DELETE /api/playlists/{id}`
  (owner only, 204), `POST /api/playlists/{id}/tracks` (append; 409 `ALREADY_IN_PLAYLIST` unless
  `allowDuplicates`), `POST /api/playlists/{id}/entries/remove`, `GET /api/me/playlists?trackId=` and
  `PUT /api/me/playlist-membership` (the track ends up in exactly the listed playlists, in one save).
  Share links and saved copies, which delete would also remove, arrive with journey 11.
- **Two ways to add.** Add to playlist for one track from its own page sets membership (checkboxes show
  where it is; Undo restores the old set). For a selection or an album it appends to each checked playlist;
  a single track already there gives the warning toast with Add again (L2-020 AC6). A dropped connection
  closes the dialog with the danger toast and Retry (AC7); other failures keep it open with "That didn’t work".
- **Dialogs.** `PlaylistDialogs` in `@hummi/api` holds the open Add to playlist or New playlist dialog; the
  shell renders `hm-playlist-dialog-host` from `@hummi/library`, as it does the sign-in prompt. Rename and
  Delete are local to the playlist page. `PlaylistDialogs.changes` makes Library and the playlist page read again.
- **Selection.** `hm-track-list` and `hm-track-row` gain `selectable`: a "Select {title}" checkbox before the
  number and a tinted row. Selection is a signal of row indexes (a track may appear twice). The selection bar
  is `hm-alert` (info) with its buttons in a new `actions` slot.
- **Toasts.** `ToastService.showCard` adds success and warning cards (with an action, dismissed after 4 s)
  beside the danger card of ADR 0012. Mocks gain the toast `added`, `duplicate` and `add-failed` states and
  selection checkboxes on the playlist page.

## Consequences

- Deleting a playlist removes its entries by cascade; tracks stay on Hummi.
- The playlist page's Share button is inert until journey 11.

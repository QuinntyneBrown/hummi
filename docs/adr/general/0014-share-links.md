# 0014. Share links are one short code per item, opened at /s/{code}

Status: Accepted (2026-10-27)

## Context

Journey 11 builds L2-024, L2-025, L2-026 and L2-045. L2-025 AC1 showed links as `hummi.fm/t/{slug}`
while L2-026 opens `/s/{code}`. The designs left the code's length and alphabet and the preview length as
`<TO SUPPLY>`, named an `IShareCodeGenerator` port and the CDK `Clipboard`, and gave access to private
playlists through "grantees of a share" without saying how a grant is made.

## Decision

- **One link kind.** Every share is `/s/{code}`, for tracks and playlists alike; L2-025 AC1 now reads
  `hummi.fm/s/{code}` and the share mock shows it. `ShareLink` (Code, TargetType, TargetId) is unique on
  both, so everyone sharing an item gets the same link. Migration `AddSharing`.
- **Code.** 8 characters from the 31-character alphabet `23456789abcdefghjkmnpqrstuvwxyz` (no 0, 1, i, l,
  o), drawn with `RandomNumberGenerator` in the domain (`ShareLink.NewCode`); about 8.5 × 10^11 codes. A
  clash draws again. Codes are matched case-insensitively.
- **Who may share.** Anyone, signed in or not, may share a track or a public playlist; a private playlist
  only its owner (`POST /api/shares`, anonymous).
- **Opening.** `GET /api/shares/{code}` returns the track slug or playlist id; an unknown code, a withdrawn
  track or a deleted playlist is 404 "This link didn’t work". A playlist link redirects to
  `/playlists/{id}?share={code}`, and the code grants viewing while the playlist is private: the grant is
  holding the link. Without it, a private playlist of someone else is the Forbidden page (L2-045).
- **Read-only playlists.** Someone else's playlist shows Play, Save to my library and Share with the info
  alert; every change endpoint stays owner-only. `SavedPlaylist` rows (`PUT`/`DELETE
  /api/me/saved-playlists/{id}?share=`) put it in Library under its owner's name. Deleting a playlist removes
  its share link and every saved copy.
- **Preview.** Play preview plays the whole track, without an account. "Start at {m:ss}" appears for the
  current track once it has played and adds `?t={seconds}`; the landing page starts there.
- **UI.** `hm-share-sheet` joins `@hummi/components` and the design system (Share sheet); it copies with
  `navigator.clipboard` and announces "Link copied." The Embed tab shows for tracks only; the
  `/embed/{slug}` player itself is not built. `ShareDialogs` in `@hummi/api` opens it; the shell renders
  `hm-share-dialog-host` from the new `@hummi/sharing`, which also serves `/s/{code}`.

## Consequences

- A leaked playlist link opens that private playlist for anyone until the playlist is deleted.
- The embed code points at a page that does not exist yet.

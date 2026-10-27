# Hummi mocks

Static HTML mocks for every page, dialog and notification, in every state. Open [index.html](index.html) locally to browse them.

## Cast and catalog

Reuse these in every mock. "Today" is **Tue 27 Oct 2026**.

- **People:** Priya Natarajan (the signed-in listener), Jonah Adeyemi, Mei Rodríguez (owns the playlist *Sunday kitchen*).
- **Artists** (AI personas, each generated with an open-weights model): Lumen Fox (ambient), Paper Satellites (lo-fi), Nocturne 7 (synthwave), Marlow & the Machines (jazz), Tidepool Choir (folk), Velvet Static (electronic).
- **Tracks:** ten, defined in `_build/kit.py`. The one playing in every mock is *Slow Orbit* by Lumen Fox (4:12, CC0). *The Quiet Between Two Lighthouses, Revisited (Extended Dream Mix)* is the long-title edge case.
- **Playlists:** *Late-night coding* (Priya, 24 tracks), *Rain on the window* (Priya, 18), *Sunday kitchen* (Mei, 31).
- **Licences:** CC0 1.0, CC BY 4.0, CC BY-SA 4.0.

## How to open

Open `index.html` from disk. Append `?theme=dark` to force the dark theme and `?chrome=0` to hide the mock bar and notes. Mocks are generated: edit `_build/screens_*.py` or `_build/kit.py`, then run:

```sh
python docs/mocks/_build/build.py
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks   # PNGs in .cache/ (never commit)
```

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | offline | partial | kids | no-results | unavailable | selected | read-only | signed-out | paused | invalid | submitting | success | unread | read | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home (`home`) | [✅](pages/home/default.html) | [✅](pages/home/loading.html) | [✅](pages/home/empty.html) | [✅](pages/home/error.html) | [✅](pages/home/offline.html) | [✅](pages/home/partial.html) | [✅](pages/home/kids.html) |  |  |  |  |  |  |  |  |  |  |  |  |
| Browse (`browse`) | [✅](pages/browse/default.html) | [✅](pages/browse/loading.html) | ➖ | [✅](pages/browse/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Genre (`genre`) | [✅](pages/genre/default.html) | [✅](pages/genre/loading.html) | [✅](pages/genre/empty.html) | [✅](pages/genre/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Search (`search`) | [✅](pages/search/default.html) | [✅](pages/search/loading.html) | [✅](pages/search/empty.html) | [✅](pages/search/error.html) |  |  |  | [✅](pages/search/no-results.html) |  |  |  |  |  |  |  |  |  |  |  |
| Track (`track`) | [✅](pages/track/default.html) | [✅](pages/track/loading.html) | ➖ | [✅](pages/track/error.html) |  |  |  |  | [✅](pages/track/unavailable.html) |  |  |  |  |  |  |  |  |  |  |
| Artist (`artist`) | [✅](pages/artist/default.html) | [✅](pages/artist/loading.html) | [✅](pages/artist/empty.html) | [✅](pages/artist/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Album (`album`) | [✅](pages/album/default.html) | [✅](pages/album/loading.html) | ➖ | [✅](pages/album/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Playlist (`playlist`) | [✅](pages/playlist/default.html) | [✅](pages/playlist/loading.html) | [✅](pages/playlist/empty.html) | [✅](pages/playlist/error.html) |  |  |  |  |  | [✅](pages/playlist/selected.html) | [✅](pages/playlist/read-only.html) |  |  |  |  |  |  |  |  |
| Library (`library`) | [✅](pages/library/default.html) | [✅](pages/library/loading.html) | [✅](pages/library/empty.html) | [✅](pages/library/error.html) |  |  |  |  |  |  |  | [✅](pages/library/signed-out.html) |  |  |  |  |  |  |  |
| Now playing (`now-playing`) | [✅](pages/now-playing/default.html) | [✅](pages/now-playing/loading.html) | [✅](pages/now-playing/empty.html) | [✅](pages/now-playing/error.html) |  |  |  |  |  |  |  |  | [✅](pages/now-playing/paused.html) |  |  |  |  |  |  |
| Queue (`queue`) | [✅](pages/queue/default.html) | [✅](pages/queue/loading.html) | [✅](pages/queue/empty.html) | [✅](pages/queue/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Shared track (`shared-track`) | [✅](pages/shared-track/default.html) | [✅](pages/shared-track/loading.html) | ➖ | [✅](pages/shared-track/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Sign in (`sign-in`) | [✅](pages/sign-in/default.html) | ➖ | ➖ | [✅](pages/sign-in/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/sign-in/invalid.html) | [✅](pages/sign-in/submitting.html) |  |  |  |  |
| Sign up (`sign-up`) | [✅](pages/sign-up/default.html) | ➖ | ➖ | [✅](pages/sign-up/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/sign-up/invalid.html) | [✅](pages/sign-up/submitting.html) | [✅](pages/sign-up/success.html) |  |  |  |
| Reset password (`reset-password`) | [✅](pages/reset-password/default.html) | ➖ | ➖ | [✅](pages/reset-password/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/reset-password/invalid.html) | [✅](pages/reset-password/submitting.html) | [✅](pages/reset-password/success.html) |  |  |  |
| Verify email (`verify-email`) | [✅](pages/verify-email/default.html) | ➖ | ➖ | [✅](pages/verify-email/error.html) |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/verify-email/success.html) |  |  |  |
| Settings (`settings`) | [✅](pages/settings/default.html) | [✅](pages/settings/loading.html) | ➖ | [✅](pages/settings/error.html) |  |  |  |  |  |  |  |  |  | [✅](pages/settings/invalid.html) | [✅](pages/settings/submitting.html) | [✅](pages/settings/success.html) |  |  |  |
| Notifications (`notifications`) | [✅](pages/notifications/default.html) | [✅](pages/notifications/loading.html) | [✅](pages/notifications/empty.html) | [✅](pages/notifications/error.html) |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/notifications/unread.html) | [✅](pages/notifications/read.html) |  |
| Licence and credit (`licence`) | [✅](pages/licence/default.html) | [✅](pages/licence/loading.html) | ➖ | [✅](pages/licence/error.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Not found (`not-found`) | [✅](pages/not-found/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Forbidden (`forbidden`) | [✅](pages/forbidden/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Server error (`server-error`) | [✅](pages/server-error/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Offline (`offline`) | [✅](pages/offline/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

### Dialogs

| Screen | default | busy | invalid | success | embed | empty | failed | rename | confirm | kids-on | saved | from-player | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Share (`share`) | [✅](dialogs/share/default.html) | ➖ | ➖ | [✅](dialogs/share/success.html) | [✅](dialogs/share/embed.html) |  |  |  |  |  |  |  |  |
| Add to playlist (`add-to-playlist`) | [✅](dialogs/add-to-playlist/default.html) | [✅](dialogs/add-to-playlist/busy.html) | ➖ |  |  | [✅](dialogs/add-to-playlist/empty.html) | [✅](dialogs/add-to-playlist/failed.html) |  |  |  |  |  |  |
| New playlist (`create-playlist`) | [✅](dialogs/create-playlist/default.html) | [✅](dialogs/create-playlist/busy.html) | [✅](dialogs/create-playlist/invalid.html) |  |  |  | [✅](dialogs/create-playlist/failed.html) | [✅](dialogs/create-playlist/rename.html) |  |  |  |  |  |
| Delete playlist (`delete-playlist`) | [✅](dialogs/delete-playlist/default.html) | [✅](dialogs/delete-playlist/busy.html) | ➖ |  |  |  | [✅](dialogs/delete-playlist/failed.html) |  | [✅](dialogs/delete-playlist/confirm.html) |  |  |  |  |
| Report track (`report-track`) | [✅](dialogs/report-track/default.html) | [✅](dialogs/report-track/busy.html) | [✅](dialogs/report-track/invalid.html) | [✅](dialogs/report-track/success.html) |  |  | [✅](dialogs/report-track/failed.html) |  |  |  |  |  |  |
| Sign in required (`sign-in-required`) | [✅](dialogs/sign-in-required/default.html) | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |
| Keyboard shortcuts (`shortcuts`) | [✅](dialogs/shortcuts/default.html) | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |
| Account menu (`account-menu`) | [✅](dialogs/account-menu/default.html) | ➖ | ➖ |  |  |  |  |  |  | [✅](dialogs/account-menu/kids-on.html) |  |  |  |
| Track menu (`track-menu`) | [✅](dialogs/track-menu/default.html) | ➖ | ➖ |  |  |  |  |  |  |  | [✅](dialogs/track-menu/saved.html) | [✅](dialogs/track-menu/from-player.html) |  |
| Sign out (`sign-out`) | [✅](dialogs/sign-out/default.html) | [✅](dialogs/sign-out/busy.html) | ➖ |  |  |  | [✅](dialogs/sign-out/failed.html) |  |  |  |  |  |  |

### Notifications

| Screen | info | success | warning | danger | play-next | removed | album-added | downloads | persistent | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|
| Toast (`toast`) | [✅](notifications/toast/info.html) | [✅](notifications/toast/success.html) | ➖ | ➖ | [✅](notifications/toast/play-next.html) | [✅](notifications/toast/removed.html) | [✅](notifications/toast/album-added.html) | [✅](notifications/toast/downloads.html) |  |  |
| Banner (`banner`) | [✅](notifications/banner/info.html) | [✅](notifications/banner/success.html) | [✅](notifications/banner/warning.html) | [✅](notifications/banner/danger.html) |  |  |  |  | [✅](notifications/banner/persistent.html) |  |

<!-- coverage:end -->

## Open questions and assumptions

No specs existed, so no `mock:requirements` are set (ADR 0002). Assumed until confirmed:

1. Listening works without an account; saving (likes, playlists, following) needs one.
2. Hummi is listener-only for now: no upload, creator dashboard or moderation tooling is mocked.
3. Reporting a track covers copyright, wrong licence and harmful content; the review SLA (2 working days) is a placeholder to confirm.
4. Offline means cached pages and saved tracks; downloading for offline is not mocked.
5. Sign-in is email and password only; social sign-in is not mocked.
6. The model that generated each track is shown on the track page and the licence page.

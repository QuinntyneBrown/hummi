# Screen composition

Describes how each screen is composed from design-system components. Generated with the `writing-screen-composition` skill once mocks and the design system exist.

## Shell

Mock: every page under `docs/mocks/pages/` (header, main, player bar). Routes with `data.bare` (Sign up, Sign in, Verify email) render only main, without the header, banner and footer (ADR 0010).

| Part | Library components | Local UI |
|---|---|---|
| Skip link | `hm-skip-link` | None |
| Confirmation banner | `hm-alert` (warning, `banner`, "Confirm your email") above the header with an `hmButton="link"` "Resend the email", while the signed-in listener's email is unconfirmed | Resend call and its toast |
| Header | `hm-top-nav` with the brand (`hm-logo`), links Home, Soca, Kids, Steelpan, Your library and the "Open navigation" toggle | End slot: `hm-search-pill` ("Search songs and artists", opens the search layer); signed out, "Sign in" and "Sign up" links styled with `hmButton`; signed in, the bell link `.ibtn.ibtn--count` "Notifications, {n} unread" with a `.badge--count` "{n}" labelled "{n} unread" from `UnreadStore`, then the `.avatar.avatar--nav` button "Account: {name}" (`aria-haspopup="menu"`, `aria-expanded`) that opens the account menu |
| Main | None | `main#main.container.app-main` wrapping the router outlet |
| Footer | None | `footer.site-footer` with the two taglines |
| Search layer | `hm-search-overlay` from `@hummi/search`, rendered while `SearchStore.open()` | None |
| Player bar | `hm-player-bar` (uses `hm-icon`, `hm-equalizer`, `hm-scrubber`) | Shown only when a track is loaded and the route has no `data.hidePlayer`; More actions, Queue and Expand open the track menu, the queue drawer and Now playing |
| Queue drawer | `hm-queue-panel` from `@hummi/player`, rendered while `PlayerOverlays.queueOpen()` | None |
| Track menu | `hm-track-menu-host` from `@hummi/player` | None |
| Account menu | `hm-account-menu` (name, email, Sign out) | Open state; focus returns to the avatar |
| Sign out | `hm-sign-out-dialog` from `@hummi/accounts`; page behind it `inert` | None |
| Sign in to save this | `hm-sign-in-prompt-dialog` from `@hummi/accounts`, rendered while `SignInGate.promptOpen()`; page behind it `inert` | None |
| Toasts | `hm-toast-region` | None |
| Keyboard shortcuts | `hm-dialog` through `ShortcutsDialogComponent`; header, main and player bar `inert` behind it | `ShortcutService` keydown handling |

## Home (`pages/home`)

| Part | Library components | Local UI |
|---|---|---|
| Billboard | `hm-billboard` (kicker, h1, artist link, blurb, meta, Opens with chip), `hmButton="primary"` `large` "Play album"/"Pause", `hmButton` `large` "Add to library" | `HomeComponent` in `@hummi/discovery`; `GET /api/home/featured` |
| Recently added, Soca, Kids, Steelpan & Calypso, Dancehall, Island chill | `hm-shelf` (rail, note, See all, Previous and Next) of `hm-track-card` with the New badge outside Recently added | One `GET /api/home/shelves/{key}` per shelf |
| Top 10 on Hummi this week | `hm-shelf` (note, See all) with `hm-track-list` numbered by rank | None |
| Loading | `hm-skeleton` billboard rect; per shelf `hm-shelf` busy with `hm-skeleton` cards | Layout only |
| Shelf failed | `hm-shelf` with `hm-error-block` ("{name} didn’t load", "Everything else on this page still works. Try the shelf again.") | Retries that shelf only |
| Error | `hm-error-block` ("We couldn’t load this page") when every part failed | None |
| Empty | `hm-empty-state` ("Your Home fills up as you listen"), `hmButton="primary"` link "Browse genres", `hm-shelf` "Start with a genre" of six `hm-genre-tile` | `GET /api/home/summary` |
| Offline | `hm-alert` (warning, banner, "You are offline. …"); only the billboard and saved shelves | `HomeApi` localStorage copies (ADR 0015) |

## Not found (`pages/not-found`)

| Part | Library components | Local UI |
|---|---|---|
| Message | `hm-error-page` with the `NOT_FOUND` copy ("404", "We couldn’t find that page"); `hmButton` links "Go to Home" (primary) and "Search Hummi" | Route data `hidePlayer: true` on the unknown route; catalogue pages render the same composition in place for an unknown slug |

## Browse (`pages/browse`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` ("Browse", "{n} genres · {n} openly licensed tracks") | None |
| Moods | `hm-shelf` with `hmChip` links in a `.pill-row` | None |
| All genres | `hm-shelf` with one `hm-genre-tile` per genre in a `.tile-grid` | None |
| Loading | `hm-shelf` (`busy`) with `hm-skeleton` tiles | Layout only |
| Error | `hm-error-block` ("Genres didn’t load") | None |

## Genre (`pages/genre`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` (genre name, "{n} tracks · {description}") | None |
| Actions | `hmButton` Play all (primary, `hm-icon` play) and Shuffle (`hm-icon` shuffle); `hmChip` toggle buttons Newest and Most played | `.cluster` row |
| Track list | `hm-track-list` labelled "{genre} tracks" | None |
| Loading | `hm-skeleton` rows inside an `aria-busy` region | Layout only |
| Empty | `hm-empty-state` ("No {genre} tracks yet") with an `hmButton` link "Browse genres" | None |
| Error | `hm-error-block` ("This genre didn’t load") | None |

## Track (`pages/track`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` (title) with a projected `subtitle` paragraph: artist link · album | None |
| Hero | `hm-hero` (cover, overline "Track · {m:ss}") holding the actions and `hm-waveform` (played proportion from `PlayerStore`) | None |
| Actions | `hmButton` Play (primary, `hm-icon` play), Add to playlist (`hm-icon` plus), Share (`hm-icon` share); ghost icon `hmButton`s "Like {title}" (`pressed`, `hm-icon` heart) and "Report this track" (`hm-icon` flag) | `.cluster` row |
| Details | `hm-description-list` (Artist, Album, Genre, Generated with, Licence, Plays) | Section heading |
| More from {artist} | `hm-shelf` with `hm-track-list` | None |
| Loading | `hm-skeleton` hero block and rows inside an `aria-busy` region | Layout only |
| Unavailable | `hm-alert` (warning, "This track is no longer available") and `hm-shelf` "Similar tracks" with `hm-track-list` | None |
| Not found | Not found composition above | None |
| Error | `hm-error-block` ("This track didn’t load") | None |

## Artist (`pages/artist`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` (name, "{n} monthly listeners") | None |
| Hero | `hm-hero` (round cover, overline "Artist · {model}", description) | None |
| Actions | `hmButton` Play (primary), Follow (`pressed`, `hm-icon` plus), Share (`hm-icon` share) | `.cluster` row |
| Popular | `hm-shelf` with `hm-track-list` labelled "Popular tracks" | None |
| Releases | `hm-shelf` with one `hm-media-tile` per album ("{year} · {n} tracks") in a `.card-grid` | None |
| Loading | `hm-skeleton` block and rows inside an `aria-busy` region | Layout only |
| Empty | `hm-empty-state` ("No tracks released yet") with a primary `hmButton` Follow | None |
| Not found | Not found composition above | None |
| Error | `hm-error-block` ("This artist didn’t load") | None |

## Album (`pages/album`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` (title) with a projected `subtitle` paragraph: artist link · Album | None |
| Actions | `hmButton` Play (primary), Add to playlist, Share | `.cluster` row |
| Tracks | `hm-track-list` labelled "{album} tracks" | None |
| Summary | None | `p.text-caption.album-summary` "{year} · {n} tracks · {minutes} min · {licence}" |
| Loading | `hm-skeleton` rows inside an `aria-busy` region | Layout only |
| Not found | Not found composition above | None |
| Error | `hm-error-block` ("This album didn’t load") | None |

## Licence and credit (`pages/licence`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` ("Licence and credit", "How you can reuse what you hear on Hummi") | None |
| Credit | `hm-alert` (info, "{title} is {licence}") with the credit line | Text from `LICENCE_TERMS` |
| Licences on Hummi | `hm-table` (caption "Licences used on Hummi"; Licence, You may, You must) | Section heading; rows from `LICENCE_TERMS` |
| Back to {title} | None | Router link to the track page |
| Loading | `hm-skeleton` block and lines inside an `aria-busy` region | Layout only |
| Not found | Not found composition above | None |
| Error | `hm-error-block` ("Licence details didn’t load") | None |

## Search (`pages/search`)

Mock: the layer over Home in every state. Rendered by the shell from `@hummi/search` (ADR 0008).

| Part | Library components | Local UI |
|---|---|---|
| Layer and bar | `hm-search-layer` (scrim, `role="dialog"` "Search", query field "Search songs and artists", "Clear" once text is typed, "Close") | None |
| Top result | `hm-top-result` (cover, title, "{artist} · {duration}") | None |
| Artists | `hm-search-artist` under a `layer-h` "Artists" heading, up to 3 | Results grid layout (`layer-search__body--results`) |
| Songs | `hm-search-song` (current track marked with `hm-equalizer`, "More actions for {title}") under "Songs", up to 7 | None |
| Loading | `hm-skeleton` rows inside an `aria-busy` body | Layout only |
| Empty | `hm-recent-searches` ("Recent", clock icons) and `hm-sound-tile` per genre in a `.sound-grid` ("Browse by sound") | Empty grid layout (`layer-search__body--empty`) |
| No results | `layer-empty` text block ("Nothing matches “{query}”") | The `layer-empty` block |
| Error | `hm-error-block` ("Search isn’t working right now") with Try again | None |

## Library (`pages/library`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` ("Library", subtitle "{n} playlists · {n} liked tracks · {n} artists"), `hmButton="primary"` "New playlist" with `hm-icon` plus | `LibraryComponent` in `@hummi/library`; counts from `GET /api/me/library` |
| Tabs | `hm-tabs` (Playlists, Liked, Following; label "Library") | Selected tab signal |
| Playlists | `hm-media-tile` per playlist in `.card-grid` ("{n} tracks · {owner}") | None |
| Liked | `hm-track-list` "Liked tracks" through `LibraryStore.withLikes` | Like toggles via `LibraryStore` |
| Following | Round `hm-media-tile` per artist in `.card-grid` ("{n} monthly listeners") | None |
| Loading | `hm-skeleton` card tiles in `.shelf__track` | None |
| Empty | `hm-empty-state` ("Your library is empty"), `hmButton="primary"` "Create a playlist", `hmButton` link "Browse genres" | None |
| Error | `hm-error-block` ("Your library didn’t load", Try again) | None |
| Signed out | `hm-empty-state` (lock, "Sign in to see your library"), `hmButton` links "Sign in" and "Create account" | None |

## Playlist (`pages/playlist`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` (name, "{n} tracks · {length} · {private|public}"), `hmButton="primary"` Play, `hmButton` Share, Rename, Delete | `PlaylistComponent` in `@hummi/library`; owner actions only when `isOwner` |
| Selection bar | `hm-alert` (info, "{n} tracks selected") with `actions`: `hmButton` "Remove from playlist", "Add to another playlist" | Selected row indexes signal |
| Tracks | `hm-track-list` with `selectable` (row checkbox "Select {title}") through `LibraryStore.withLikes` | None |
| Loading | `hm-skeleton` rows in `.track-list` | None |
| Empty | `hm-empty-state` ("Nothing here yet"), `hmButton="primary"` link "Browse genres"; only Share in the header | None |
| Error | `hm-error-block` ("This playlist didn’t load"); 403 shows the Forbidden page | None |
| Read-only | `hm-alert` (info, "This playlist belongs to {owner}"); header Play, `hmButton` with `pressed` "Save to my library", Share; no selection | Opened with `?share={code}` from a share link |

## Add to playlist (`dialogs/add-to-playlist`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` ("Add “{title}” to a playlist", "Pick one or more. You can change this later.") | `AddToPlaylistDialogComponent` in `@hummi/library`, rendered by the shell's `hm-playlist-dialog-host` |
| Choices | `fieldset` of `hm-checkbox` per playlist (hint "{n} tracks"), ghost `hmButton` "New playlist" | Membership or append mode (ADR 0013) |
| Footer | `hmButton` Cancel, `hmButton="primary"` Save; busy "Saving…" with `.spinner` | None |
| Failed | `hm-alert` (danger, "That didn’t work") | None |
| Empty | `hm-empty-state` ("No playlists"), `hmButton="primary"` "Create playlist" | None |
| Toasts | `ToastService.showCard` success "Added to {playlist}" with Undo, warning "Already in this playlist" with Add again, danger "Couldn’t add the track" with Retry | None |

## New playlist and Rename (`dialogs/create-playlist`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` ("New playlist" or "Rename playlist") | `PlaylistFormDialogComponent` in `@hummi/library` |
| Fields | `hm-text-field` "Playlist name" (required, help "Up to 60 characters"), `hm-checkbox` "Make it public" | Name check mirrored from `PlaylistName` |
| Footer | `hmButton` Cancel, `hmButton="primary"` "Create playlist" or "Save name"; busy "Saving…" | None |
| Failed | `hm-alert` (danger, "That didn’t work") | None |

## Delete playlist (`dialogs/delete-playlist`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` (danger, "Delete “{name}”?") | `DeletePlaylistDialogComponent` in `@hummi/library` |
| Field | `hm-text-field` "Type the playlist name to confirm" (help "This deletes {n} tracks from the playlist, not from Hummi.") | Exact-match check |
| Footer | `hmButton` Cancel, `hmButton="danger"` "Delete playlist" (disabled until it matches); busy "Deleting…" | None |
| Failed | `hm-alert` (danger, "That didn’t work") | None |

## Share (`dialogs/share`)

| Part | Library components | Local UI |
|---|---|---|
| Sheet | `hm-share-sheet` (cover, "Share {name}", "Free for anyone to play — no account needed.", Close) | `ShareDialogComponent` in `@hummi/sharing`, rendered by the shell's `hm-share-dialog-host` |
| Link | `hm-share-sheet` Link tab: link box "{host}/s/{code}" with Copy ("Copied", "Link copied."), "Start at {m:ss}" when the current track has played | Link from `POST /api/shares` |
| Embed | `hm-share-sheet` Embed tab (tracks only): `embed-card` preview and the iframe code with Copy | None |
| Send | `hm-share-sheet` "Send it straight to": WhatsApp, Email, Messages | Target URLs |

## Shared track (`pages/shared-track`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` (title, artist) | `SharedLinkComponent` in `@hummi/sharing` at `/s/{code}` |
| Hero | `hm-hero` with overline "Shared with you", meta "{artist} · {album} · {m:ss} · {licence}", `hmButton="primary"` "Play preview", `hmButton` link "Sign up to save it", `hm-waveform` | Licence short names |
| Alert | `hm-alert` (info, "Free to listen, free to keep") | None |
| Loading | `hm-skeleton` rect | None |
| Error | `hm-error-block` ("This link didn’t work") | A playlist code redirects to its page instead |

## Forbidden (`pages/forbidden`)

| Part | Library components | Local UI |
|---|---|---|
| Page | `hm-error-page` (lock, "403", "You don’t have access to this", the private-playlist text), `hmButton="primary"` link "Go to Home", `hmButton` link "Switch account" | Rendered by `PlaylistComponent` for a 403 |

## Settings (`pages/settings`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` ("Settings", "{name} · {email}") | `SettingsComponent` in `@hummi/settings`; `SettingsStore` in `@hummi/api` |
| Profile | `.card` section with `hm-text-field` Display name (required) and Email (help "We use this for sign-in and account emails only.") | None |
| Playback | `.card` section with `hm-switch` Autoplay similar tracks and Crossfade | Applied by `PlayerStore.setPreferences` |
| Appearance | `.card` section with `hm-radio-group` Theme: Match my device, Light, Dark | Applied at once by `SettingsStore.applyTheme` |
| Notifications | `.card` section with `hm-switch` New tracks from artists I follow and Product news | None |
| Actions | `.form-actions`: `hmButton="primary"` "Save changes" (busy "Saving…"), `hmButton` "Sign out" | Opens the shell's Sign out dialog via `AccountDialogs` |
| Invalid | `hm-error-summary` and the field's error ("Display name can’t be empty") | None |
| Saved | `hm-alert` (success, "Settings saved") | None |
| Failed | `hm-alert` (danger, "Settings weren’t saved") | ADR 0016 |
| Loading | `hm-skeleton` rects | None |
| Error | `hm-error-block` ("Settings didn’t load") | None |
| Signed out | `hm-empty-state` (lock, "Sign in to change your settings"), Sign in and Create account | ADR 0016 |

## Notifications (`pages/notifications`)

| Part | Library components | Local UI |
|---|---|---|
| Header | `hm-page-header` ("Notifications", subtitle "{n} unread"), `hmButton` "Mark all as read" while any are unread | `NotificationsComponent` in `@hummi/notifications` |
| Items | `hm-notification-item` per notification (kind icon, linked text, time, Unread dot) in a `.list` | Wording per kind and relative times |
| Loading | `hm-skeleton` lines in `.notif` rows | None |
| Empty | `hm-empty-state` (bell, "You’re all caught up"), `hmButton="primary"` link "Find artists to follow" | None |
| Error | `hm-error-block` ("Notifications didn’t load"); a visitor sees "Sign in to see your notifications" | None |

## Report a track (`dialogs/report-track`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` ("Report “{title}”", "Tell us what’s wrong. The artist isn’t told who reported.") | `ReportTrackDialogComponent` in `@hummi/reporting`, rendered by the shell's `hm-report-dialog-host` |
| Reason | `hm-radio-group` "What’s wrong?" (four reasons) with its error "Choose a reason" | None |
| Details | `hm-textarea` "Details" (optional) | Up to 1,000 characters |
| Footer | `hmButton` Cancel, `hmButton="primary"` "Send report"; busy "Sending…" with `.spinner` | None |
| Failed | `hm-alert` (danger, "That didn’t work") | Answers kept |
| Success | `hm-dialog` ("Thanks, we’ll take a look"), `hmButton="primary"` Close | None |

## Server error (`pages/server-error`)

| Part | Library components | Local UI |
|---|---|---|
| Page | `hm-error-page` (alert, "500", "Something broke on our side", the fixing text), `hmButton="primary"` "Try again" (reloads), `hmButton` link "Go to Home" | `ServerErrorComponent` in the hummi application, shown by `ServerErrorHandler` |

## Now playing (`pages/now-playing`)

Mock: the layer over Home. Routed at `/now-playing` in `@hummi/player`; the player bar is hidden there (ADR 0009).

| Part | Library components | Local UI |
|---|---|---|
| Layer | `hm-player-layer` (`role="dialog"` "Now playing", "Close", "Playing from {genre}", cover, title, artist) | None |
| Scrubber | `hm-scrubber` (full) inside `hm-player-layer` | None |
| Controls | `hm-player-layer` (Shuffle and Repeat as `aria-pressed` toggles, Previous track, Play or Pause, Next track) | None |
| Actions | `hm-player-layer` (Save or Saved, Share, Queue, "More actions for {title}") | None |
| Up next | `hm-player-layer` (two `srow` rows with cover, title, artist, duration) | None |
| Error | `hm-alert` (danger, "Playback stopped") inside `hm-player-layer` | None |
| Empty | `hm-empty-state` ("Nothing is playing") inside `hm-player-layer` | "Browse genres" router link styled with `hmButton` |
| Loading | Not reachable: the layer renders `PlayerStore`, which never waits | None |

## Queue (`pages/queue`)

Mock: the drawer over Home. Rendered by the shell from `@hummi/player` (`hm-queue-panel`) while `PlayerOverlays.queueOpen()`.

| Part | Library components | Local UI |
|---|---|---|
| Drawer | `hm-queue-drawer` (aside "Queue", "Close queue") | None |
| Now playing | `hm-queue-drawer` `q-row--now` with `eq--live` while playing | None |
| Up next | `hm-queue-drawer` ("Up next · {n}", Clear, "Remove {title} from the queue") | None |
| Then, more {genre} | `hm-queue-drawer` dimmed `q-row--more` rows, up to four | Loading the genre's tracks |
| Empty | `hm-queue-drawer` `q-empty` hint | None |
| Loading, error | Not reachable: the queue is browser state; a failed "Then, more" load leaves the list out | None |

## Track menu (`dialogs/track-menu`)

Rendered by the shell from `@hummi/player` (`hm-track-menu-host`) for `PlayerOverlays.trackMenu()`.

| Part | Library components | Local UI |
|---|---|---|
| Menu | `hm-track-menu` (scrim, "Track actions", head with cover and "{artist} · {duration}") | None |
| Items | `hm-track-menu` (Play next, Add to queue, Save to library or Remove from library, Share, More from {artist}, Go to {genre}) | Actions: queue edits, search, genre route |
| Confirmation | `hm-toast-region` through `ToastService` | Toast messages |

## Keyboard shortcuts (`dialogs/shortcuts`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` ("Keyboard shortcuts", keyboard icon, description, Close) | `ShortcutsDialogComponent` in the shell |
| Shortcuts | `hm-description-list` with `keys` | Rows from `SHORTCUTS` |
| Close | Button styled with `hmButton="primary"` in the dialog footer | None |

## Toast (`notifications/toast`)

| Part | Library components | Local UI |
|---|---|---|
| Region | `hm-toast-region` (polite live region, `toast-region--noplayer` without the player bar) | Rendered once by the shell |
| Pill | `hm-toast-region` pill: track cover or coral dot, message, optional Undo; dismissed after 4 seconds | None |
| Danger | `hm-toast-region` danger toast (`ToastService.showDanger`): alert icon, title, text, optional action (Retry), Dismiss; stays until dismissed (ADR 0012) | Shell turns `LibraryStore.problem` into it |
| Success, warning | `hm-toast-region` cards (`ToastService.showCard`): icon, title, text, optional action (Undo, Add again), Dismiss; dismissed after 4 seconds (ADR 0013) | None |

## Sign up (`pages/sign-up`)

| Part | Library components | Local UI |
|---|---|---|
| Card | `hm-auth-card` ("Create your free account", intro) | None |
| Fields | `hm-text-field` Display name, Email, Password (help "At least 10 characters"); `hm-checkbox` terms with its hint | Client checks in `SignUpComponent` |
| Invalid | `hm-error-summary` ("Fix {n} things to continue") and each field's error | None |
| Submitting | Read-only `hm-text-field`s; `hmButton="primary"` `large` `block` `busy` "Create account…" with `.spinner` | None |
| Error | `hm-alert` (danger, "We couldn’t create your account") | None |
| Success | `hm-auth-card` ("Check your inbox"), `hm-alert` (success, "Account created", Start again), `hmButton` link "I’ve confirmed my email" | None |
| Footer | None | "Already have an account? Sign in" paragraph |

## Sign in (`pages/sign-in`)

| Part | Library components | Local UI |
|---|---|---|
| Card | `hm-auth-card` ("Welcome back", intro) | None |
| Fields | `hm-text-field` Email, Password; `hm-checkbox` "Keep me signed in" (checked); "Forgot password?" link | `.cluster.cluster--between` row |
| Invalid | `hm-error-summary` ("Fix 2 things to continue") and each field's error | None |
| Submitting | Read-only fields; `hmButton="primary"` `busy` "Sign in…" with `.spinner` | None |
| Error | `hm-alert` (danger, "That email and password don’t match", reset link); other failures "Sign in isn’t working right now" | None |
| Footer | None | "New to Hummi? Create a free account" paragraph |

## Reset password (`pages/reset-password`)

| Part | Library components | Local UI |
|---|---|---|
| Card | `hm-auth-card` ("Reset your password", intro) | `ResetPasswordComponent` in `@hummi/accounts` |
| Field | `hm-text-field` Email (required) | Client check in `ResetPasswordComponent` |
| Invalid | `hm-error-summary` ("Enter the email you signed up with") and the field's error | None |
| Submitting | Read-only `hm-text-field`; `hmButton="primary"` `large` `block` `busy` "Send reset link…" with `.spinner` | None |
| Error | `hm-alert` (danger, "We couldn’t send the email") | None |
| Success | `hm-auth-card` ("Check your inbox"), `hmButton="primary"` link "Back to sign in" | None |
| Footer | Ghost `hmButton` link "Back to sign in" | None |

## New password (`pages/new-password`)

| Part | Library components | Local UI |
|---|---|---|
| Card | `hm-auth-card` ("Choose a new password", intro) | `NewPasswordComponent` in `@hummi/accounts` |
| Field | `hm-text-field` New password (required, help "At least 10 characters") | Client check in `NewPasswordComponent` |
| Invalid | `hm-error-summary` ("Use at least 10 characters") and the field's error | None |
| Submitting | Read-only `hm-text-field`; `hmButton="primary"` `large` `block` `busy` "Change password…" with `.spinner` | None |
| Error (expired) | `hm-auth-card` ("This link has expired"), `hmButton="primary"` link "Request a new link", ghost `hmButton` link "Back to sign in" | None |
| Failed | `hm-alert` (danger, "We couldn’t change your password") above the field (ADR 0011) | None |
| Success | `hm-auth-card` ("Password changed"), `hmButton="primary"` link "Sign in" | None |

## Verify email (`pages/verify-email`)

| Part | Library components | Local UI |
|---|---|---|
| Default (confirming) | `hm-auth-card` ("Confirming your email…") with `hm-progress` (indeterminate, "Confirming email") | None |
| Success | `hm-auth-card` ("Email confirmed"), `hmButton` link "Start listening" | None |
| Error (expired) | `hm-auth-card` ("This link has expired"), `hmButton="primary"` "Send a new link", ghost `hmButton` link "Back to sign in" | Resend toast through `ToastService` |

## Sign out (`dialogs/sign-out`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` ("Sign out of Hummi?", logout icon, description) | `SignOutDialogComponent` in `@hummi/accounts` |
| Footer | `hmButton` Cancel, `hmButton="primary"` Sign out (`hm-icon` logout) | None |
| Busy | Cancel disabled; `busy` "Signing out…" with `.spinner` | None |
| Failed | `hm-alert` (danger, "That didn’t work") in the dialog body | None |

## Sign in required (`dialogs/sign-in-required`)

| Part | Library components | Local UI |
|---|---|---|
| Dialog | `hm-dialog` ("Sign in to save this", lock icon, description) | `SignInPromptDialogComponent` in `@hummi/accounts` |
| Footer | `hmButton` Not now and Create account, `hmButton="primary"` Sign in | Navigation with `returnUrl` |

## Account menu (`dialogs/account-menu`)

| Part | Library components | Local UI |
|---|---|---|
| Menu | `hm-account-menu` (scrim, `role="menu"` "Account", identity, divider, Sign out) | Rendered by the shell |
| Items | Projected `.mi` items | None yet: Kids mode and the destinations join with their journeys (ADR 0010) |

## Banner (`notifications/banner`)

| Part | Library components | Local UI |
|---|---|---|
| Persistent | `hm-alert` (warning, `banner`) "Confirm your email. Check your inbox to keep saving playlists. Resend the email." | Rendered by the shell |
| Info, success, warning, danger | `hm-alert` with `banner` and `dismissible` (Dismiss): maintenance (info), back online (success), offline (warning), playback can’t start (danger, announced as alert) | `BannerService` in `@hummi/api`; the shell renders them above the header (ADR 0019) |

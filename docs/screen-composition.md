# Screen composition

Describes how each screen is composed from design-system components. Generated with the `writing-screen-composition` skill once mocks and the design system exist.

## Shell

Mock: every page under `docs/mocks/pages/` (header, main, player bar). Routes with `data.bare` (Sign up, Sign in, Verify email) render only main, without the header, banner and footer (ADR 0010).

| Part | Library components | Local UI |
|---|---|---|
| Skip link | `hm-skip-link` | None |
| Confirmation banner | `hm-alert` (warning, `banner`, "Confirm your email") above the header with an `hmButton="link"` "Resend the email", while the signed-in listener's email is unconfirmed | Resend call and its toast |
| Header | `hm-top-nav` with the brand (`hm-logo`), links Home, Soca, Kids, Steelpan, Your library and the "Open navigation" toggle | End slot: `hm-search-pill` ("Search songs and artists", opens the search layer); signed out, "Sign in" and "Sign up" links styled with `hmButton`; signed in, the `.avatar.avatar--nav` button "Account: {name}" (`aria-haspopup="menu"`, `aria-expanded`) that opens the account menu |
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
| Recently added | `hm-shelf` (rail) of `hm-track-card` | None |
| Top 10 on Hummi this week | `hm-shelf` with `hm-track-list` | None |
| Loading | `hm-shelf` with `hm-skeleton` cards and rows inside an `aria-busy` region | Layout only |
| Error | `hm-error-block` ("We couldn’t load this page") | None |

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
| Info, success, warning, danger | `hm-alert` with `banner` | Built with journey 16 |

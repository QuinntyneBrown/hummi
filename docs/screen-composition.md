# Screen composition

Describes how each screen is composed from design-system components. Generated with the `writing-screen-composition` skill once mocks and the design system exist.

## Shell

Mock: every page under `docs/mocks/pages/` (header, main, player bar).

| Part | Library components | Local UI |
|---|---|---|
| Skip link | `hm-skip-link` | None |
| Header | `hm-top-nav` with the brand (`hm-logo`), links Home, Soca, Kids, Steelpan, Your library and the "Open navigation" toggle | End slot: `hm-search-pill` ("Search songs and artists", opens the search layer); signed out, "Sign in" and "Sign up" links styled with `hmButton`; signed in, the display name |
| Main | None | `main#main.container.app-main` wrapping the router outlet |
| Footer | None | `footer.site-footer` with the two taglines |
| Search layer | `hm-search-overlay` from `@hummi/search`, rendered while `SearchStore.open()` | None |
| Player bar | `hm-player-bar` (uses `hm-icon`, `hm-equalizer`, `hm-scrubber`) | Shown only when a track is loaded and the route has no `data.hidePlayer`; More actions, Queue and Expand open the track menu, the queue drawer and Now playing |
| Queue drawer | `hm-queue-panel` from `@hummi/player`, rendered while `PlayerOverlays.queueOpen()` | None |
| Track menu | `hm-track-menu-host` from `@hummi/player` | None |
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

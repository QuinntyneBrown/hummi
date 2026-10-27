# Hummi design system

Extracted from [docs/mocks](../mocks/README.md) on 2026-10-27. Open [index.html](index.html) locally. Brand identity (logo v1, palette) lives in [assets/README.md](assets/README.md).

## Foundations

| Page | Covers |
|---|---|
| [Color](foundations/color.html) | Brand ramps, roles, status and verified contrast. |
| [Typography](foundations/typography.html) | DM Sans, the scale and roles. |
| [Spacing](foundations/spacing.html) | The 4px scale and its rules. |
| [Layout](foundations/layout.html) | Breakpoints, grid, templates. |
| [Elevation](foundations/elevation.html) | Shadows, surfaces, z-order. |
| [Shape](foundations/shape.html) | Radii and borders. |
| [Motion](foundations/motion.html) | Durations, easings, reduced motion. |
| [Iconography](foundations/iconography.html) | Icon style and set. |
| [Theming](foundations/theming.html) | How light, dark and brand themes work. |
| [Responsive](foundations/responsive.html) | Mobile-first rules. |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA commitments. |
| [Content](foundations/content.html) | Voice, tone and microcopy. |

## Components

| Component | Group | Variants | Source mocks |
|---|---|---|---|
| [Button](components/button.html) | Actions | Primary, Secondary (default), Ghost, Link | home/default, track/default |
| [Button group](components/button-group.html) | Actions | Segmented, Toolbar | library/default, genre/default |
| [Link](components/link.html) | Actions | Inline, With icon, Muted track title | track/default, sign-in/default |
| [Menu](components/menu.html) | Actions | Default | track/default, playlist/default |
| [Text field](components/text-field.html) | Inputs | Default, With help, Invalid, Search | sign-in/default, sign-in/invalid |
| [Textarea](components/textarea.html) | Inputs | Default, Invalid | report-track/default |
| [Select](components/select.html) | Inputs | Default, Invalid | playlist/default |
| [Checkbox](components/checkbox.html) | Inputs | Single, With description, Group | sign-up/default, add-to-playlist/default |
| [Radio group](components/radio-group.html) | Inputs | Vertical, With descriptions | settings/default |
| [Switch](components/switch.html) | Inputs | Off, On | settings/default |
| [Form field](components/form-field.html) | Inputs | Label, control and help, With error | sign-up/invalid, create-playlist/invalid |
| [Form layout](components/form-layout.html) | Inputs | Invalid submit, Submitting | sign-up/invalid, settings/invalid |
| [Top bar](components/top-bar.html) | Navigation | Signed in, Signed out | home/default, home/offline |
| [Sidebar navigation](components/sidebar-nav.html) | Navigation | With badge and group | home/default, settings/default |
| [Tabs](components/tabs.html) | Navigation | Underline with count | library/default, search/default |
| [Breadcrumb](components/breadcrumb.html) | Navigation | Default | genre/default |
| [Pagination](components/pagination.html) | Navigation | Numbered | genre/default |
| [Skip link](components/skip-link.html) | Navigation | Focused | home/default |
| [Account menu](components/account-menu.html) | Navigation | Signed in | account-menu/default |
| [Card](components/card.html) | Containers | Default, Interactive, Selected | settings/default, sign-in/default |
| [Dialog](components/dialog.html) | Containers | Confirmation, Destructive | create-playlist/default, delete-playlist/confirm |
| [Tooltip](components/tooltip.html) | Containers | On an icon button | home/default |
| [Divider](components/divider.html) | Containers | Horizontal, In a menu | track/default |
| [Layout primitives](components/layout.html) | Containers | Stack, Cluster, Auto grid | home/default, settings/default |
| [Share sheet](components/share-sheet.html) | Containers | Link, Copied | share/default, share/embed |
| [Table](components/table.html) | Data display | Default | licence/default |
| [List](components/list.html) | Data display | Two-line, Interactive | notifications/default |
| [Description list](components/description-list.html) | Data display | Default | track/default |
| [Avatar](components/avatar.html) | Data display | Initials, As account link | home/default, settings/default |
| [Badge](components/badge.html) | Data display | Status and count | home/default, notifications/default |
| [Chip](components/chip.html) | Data display | Filter and link | library/default, genre/default |
| [Toast](components/toast.html) | Feedback | Success with undo, Info, Warning, Danger | toast/success, toast/stacked |
| [Alert and banner](components/alert.html) | Feedback | Info, Success, Warning, Danger | home/offline, settings/success |
| [Inline message](components/inline-message.html) | Feedback | Hint, Error, Success | sign-up/invalid, share/success |
| [Progress bar](components/progress.html) | Feedback | Determinate, Indeterminate, Success | verify-email/default |
| [Spinner](components/spinner.html) | Feedback | Inline, In a button | sign-in/submitting, create-playlist/busy |
| [Skeleton](components/skeleton.html) | Feedback | Text and title, Media tile | home/loading, playlist/loading |
| [Empty state](components/empty-state.html) | Feedback | First run, No results, Error | library/empty, search/no-results |
| [Error page](components/error-page.html) | Feedback | 404, Offline | not-found/default, forbidden/default |
| [Toast pill](components/toast-pill.html) | Feedback | Queue, Play next, With Undo, No cover | toast/info, toast/play-next |
| [Cover](components/cover.html) | Media | Colourway 1, Colourway 2, Colourway 3, Colourway 4 | home/default, track/default |
| [Track row](components/track-row.html) | Media | Default, Playing | playlist/default, queue/default |
| [Media tile](components/media-tile.html) | Media | Track, Artist | home/default, library/default |
| [Genre tile](components/genre-tile.html) | Media | Default, All colourways | browse/default, home/empty |
| [Player bar](components/player-bar.html) | Media | Playing, Disabled (nothing queued) | home/default, now-playing/default |
| [Waveform](components/waveform.html) | Media | 33% played, Unplayed | track/default, now-playing/default |
| [Hero](components/hero.html) | Media | Recommendation | home/default, track/default |
| [Notification item](components/notification-item.html) | Media | Unread and read | notifications/default, notifications/read |
| [Search layer](components/search-layer.html) | Media | Search pill, Bar, empty, Bar, with text, Top result | search/default, search/empty |
| [Now playing layer](components/player-layer.html) | Media | Playing, Controls, Repeat on, Actions | now-playing/default, now-playing/paused |
| [Queue drawer](components/queue-drawer.html) | Media | With tracks, Empty hint | queue/default, queue/empty |
| [Track menu](components/track-menu.html) | Media | Default, Saved | track-menu/default, track-menu/saved |
| [Billboard](components/billboard.html) | Media | Featured album | home/default, home/partial |

## Patterns

| Pattern | Covers |
|---|---|
| [Forms](patterns/forms.html) | Layout, validation timing, error summary and submit states. |
| [Feedback and loading](patterns/feedback-and-loading.html) | Which feedback for which action, and skeleton vs spinner vs progress. |
| [Empty and error states](patterns/empty-and-error-states.html) | Copy formulas and when to use each. |
| [Navigation and page structure](patterns/navigation-and-page-structure.html) | Shell, page header, breadcrumbs and back behaviour. |
| [Dialogs and overlays](patterns/dialogs-and-overlays.html) | Dialog vs drawer vs popover vs page, stacking and mobile sheets. |
| [Data tables and lists](patterns/data-tables-and-lists.html) | Density, selection, bulk actions and responsive strategy. |
| [Notifications](patterns/notifications.html) | Toast vs banner vs notification centre, priority and auto-dismiss rules. |
| [Content and tone](patterns/content-and-tone.html) | Voice, casing, numbers and the microcopy library. |

## Tokens

- `tokens/tokens.css`: source of truth (primitives, semantic tokens, light and dark themes).
- `tokens/tokens.json`: DTCG export generated by `tokens_to_json.py`.
- `tokens/contrast-pairs.json`: every foreground/background pairing the components rely on.
- `assets/components.css`: the product stylesheet; the mocks link it too.

## Drift found in the mocks

| Mock or file | Issue | Resolution |
|---|---|---|
| `assets/tokens.css` | The brand ramp was named `--palette-blue-*` although it holds coral. | Renamed to `--palette-coral-*` everywhere. |
| `assets/ui.css` | Cover and genre tiles used the literal `white` and reached into primitive `--palette-*` tokens. | Added `--color-fg-on-media` and six `--color-cover-N-from/to` semantic tokens; contrast pairs added. |
| `assets/ui.css` | A `.logo` class collided with the auth card’s `.auth-card .logo` rule and broke the dark wordmark swap. | Renamed the image classes to `brand-logo` and `brand-logo--light/dark`. |
| `assets/ui.css` | Off-grid values (`0.1rem`, `0.35em`, `-1px`, `2px`) in inline code, kbd and joined controls. | Accepted: they are relative to text size or are hairline overlaps, not layout spacing. |
| `assets/ui.css` | Breakpoints `40rem`, `47.99rem` and `63.99rem` used beside the two layout breakpoints. | `40rem` (640px) is the dialog sheet switch and is documented in Responsive; `max-width` pairs are the complements of `48rem` and `64rem`. |
| `pages/*/default.html` | Mobile search field shrank to a few pixels beside the spacer. | Fixed in components.css: the spacer hides under 1024px and search grows. |
| `assets/ui.css` | Error summary had no padding or background. | Added padding, `--color-danger-bg` and radius to `.form-summary`. |

## Regenerating

```sh
python docs/design-system/_build/build.py
python ~/.claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
python ~/.claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css
```

## Verification

Run on 2026-10-27:

- `check_design_system.py docs/design-system`: 66 pages (45 components, 8 patterns), 0 errors, 0 warnings.
- `check_contrast.py tokens/tokens.css`: 134 pairs passed, 0 failed, both themes.
- `check_mocks.py docs/mocks --write`: 33 screens, 124 mocks, 0 errors, 0 warnings, with the mocks linking the system's `tokens.css` and `components.css` (the `docs/mocks/assets/tokens.css` and `ui.css` files are one-line `@import` shims for the gallery).
- Screenshots (`screenshot_mocks.py`, 360/768/1280, light and dark) were rendered for the system and the mocks; the index, Button, Player bar, Color and a mock page were reviewed by eye. The rest were not inspected one by one.

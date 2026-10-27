# Hummi brand assets

Logo v1, taken from the Magic Patterns "Hummi logo board"
(https://www.magicpatterns.com/os/qvjokkETC3kGZUXEQhvATw/m7ZHXf98NoqhQdMwpZEGit).
Every file is an SVG drawn from the same monoline paths, so they scale without loss.

## Palette

| Name | Hex | Role |
|---|---|---|
| Coral | `#F0533A` | The mark, app-icon tile, the i's dot in every variant |
| Coral deep | `#D9432C` | Pressed/hover coral on large surfaces |
| Cream | `#FBF3E4` | Light background; mark colour on dark |
| Cream 2 | `#F3E7D1` | Light surface |
| Plum ink | `#24182B` | Text; dark background |
| Plum ink 2 | `#34263C` | Dark surface |
| Muted | `#8A7B72` | Captions on the board only (3.7:1 on cream, below AA for body text) |

Type: DM Sans (400, 500, 700) with a system sans-serif fallback.

## Files

| File | Use |
|---|---|
| `hummi-wordmark-coral.svg` | Primary wordmark: coral on cream or white |
| `hummi-wordmark-cream.svg` | Wordmark on dark: cream strokes, coral dot |
| `hummi-wordmark-ink.svg` | Mono wordmark: plum ink strokes, coral dot (print, light surfaces where coral is busy) |
| `hummi-icon-coral.svg` | Icon glyph, coral, transparent background |
| `hummi-icon-cream.svg` | Icon glyph for dark backgrounds, coral dot |
| `hummi-icon-ink.svg` | Icon glyph, plum ink, coral dot |
| `hummi-tile-coral.svg` | App icon / favicon tile: cream glyph on coral, 24% corner radius |
| `hummi-tile-cream.svg` | Light tile: coral glyph on cream (add a 1px ink/10% ring on cream surfaces) |
| `hummi-tile-plum.svg` | Dark tile: cream glyph, coral dot, on plum ink |
| `favicon.svg` | Copy of the coral tile; shipped at `src/frontend/projects/hummi/public/favicon.svg` |

## Construction rules

- **The hum.** Both m's are one continuous line that bounces through the baseline between them.
- **The dot.** A full round dot over the i, one stroke wide. It is the piece that travels: favicon, app icon, loading pulse.
- **The stroke.** Monoline, round caps, round joins, no sharp corners anywhere. Never outline, skew or re-weight it.
- Wordmark viewBox is `6 6 552 168` (aspect 3.29:1); the icon is square. Keep clear space of at least one stroke width (24 units of the wordmark) on every side.
- On coral the mark is cream. On cream or white it is coral. On plum it is cream with a coral dot. Do not place the coral wordmark on plum, it falls below contrast.
- The favicon is always the coral tile so the mark stays visible on both light and dark browser chrome.

## In the frontend

`@hummi/components` exports `LogoComponent` (`<hm-logo variant="wordmark|icon">`), which inlines these paths and colours them from the `--color-logo` and `--color-brand` tokens, so the mark follows the colour scheme automatically.

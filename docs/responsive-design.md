# Responsive design

Best practices for responsive web applications, summarised from current guidance, and how each one
applies to Hummi. Use this document when building or reviewing any shell part, page, dialog or
component. The mocks in `docs/mocks/` and the tokens in `docs/design-system/` remain the source of
truth for what each screen looks like; this document covers how it adapts to the window.

## Principles

1. **Mobile first.** Write the base styles for the narrowest screen and add layout with
   `min-width` media queries as space grows. Google indexes the mobile rendering first, so a layout
   that breaks on a phone also hurts search.
2. **Content decides breakpoints, not devices.** Add a breakpoint where the content stops working,
   not at a named phone or tablet width. Use `rem` breakpoints so they follow the user's font size.
3. **Fluid between breakpoints.** Layouts stretch and wrap continuously between breakpoints; nothing
   should only look right at exactly 375, 768 or 1440 px.
4. **One-direction scrolling.** The page scrolls vertically only. Wide content (rails, tables)
   scrolls inside its own region, never the page.
5. **Same content and functions at every size.** Small screens rearrange or collapse controls behind
   a toggle; they never drop functions.

## The app shell

- **Full width, at least full height.** The shell spans the whole window (`width: 100%`, no max
  width on the shell itself) and is at least the window height, so the footer never floats
  mid-window on a tall screen.
- **Use dynamic viewport units.** `min-height: 100dvh` tracks mobile browser toolbars as they show
  and hide; `100vh` on mobile is the height with the toolbars hidden and causes overflow. Use `svh`
  for content that must be visible on first load. Declare a `100vh` fallback first only if a browser
  older than Safari 15.4 or Firefox 101 must be supported.
- **Column layout.** The shell is a flex column: header, `main` that grows (`flex: 1`), then the
  footer. The page itself scrolls; avoid making only an inner `div` scroll, which breaks browser
  find, scroll restoration, pull-to-refresh and keyboard scrolling.
- **Constrain content, not chrome.** The header, player bar and backgrounds run edge to edge; the
  readable content sits in a centred container (`.container`, max width
  `--layout-container-max`, side padding `--layout-margin`).
- **Reserve space for fixed bars.** A fixed or sticky player bar overlaps the page; pad `main` by
  the bar's height (`.has-player .app-main`) so the last row and the footer stay reachable. Add
  `env(safe-area-inset-bottom)` for phones with a home indicator (needs
  `viewport-fit=cover` in the viewport meta).
- **Sticky header.** Keep it short on small screens; a tall sticky header eats a large share of a
  phone screen. Collapse the navigation behind a menu toggle below the wide breakpoint (Hummi:
  `64rem`).

## Layout techniques

- **Grid for two dimensions, Flexbox for one.** Use CSS Grid for page regions and card grids
  (`repeat(auto-fill, minmax(…, 1fr))` adapts the column count with no media query); use Flexbox
  for rows of controls; use `flex-wrap` and `gap` so items reflow instead of overflowing.
- **Container queries for components.** A component (track card, track row, player bar) should
  adapt to the space it is given, not to the window, so it works in a rail, a grid or a sidebar.
  Use `container-type: inline-size` on the wrapper and `@container` rules in the component.
  Container queries work in all current browsers.
- **Intrinsic sizing.** Prefer `min()`, `max()`, `clamp()`, `minmax()` and `fit-content` over fixed
  widths. Give flex and grid children `min-width: 0` so long titles truncate instead of pushing the
  layout wider than the screen.
- **Logical properties.** Use `margin-inline`, `padding-block` and similar so layouts survive
  right-to-left text.

## Typography

- **Fluid type with `clamp()`.** For example `font-size: clamp(1.75rem, 1.2rem + 2.5vw, 3rem)`
  scales a heading between a minimum and a maximum. Always include a `rem` term so text still
  responds to browser zoom; pure `vw` sizes ignore zoom and fail WCAG 1.4.4.
- **Readable line length.** Keep body text to roughly 45–75 characters (`max-width: 65ch`).
- **Long strings.** Truncate single-line metadata with `text-overflow: ellipsis` and expose the
  full text (title attribute or the detail page); wrap headings with `text-wrap: balance`.
- Keep type values in the design tokens; change the scale there, never in a component.

## Media

- Give images `max-width: 100%; height: auto` and an `aspect-ratio` (covers are `1 / 1`) so space
  is reserved before they load and nothing shifts.
- Serve sized sources with `srcset` and `sizes` (or `<picture>`), and `loading="lazy"` for images
  below the fold; keep the first visible cover eager.

## Touch and input

- **Target size.** WCAG 2.2 (2.5.8, AA) requires pointer targets of at least 24 × 24 CSS px or
  enough spacing; aim for 44 × 44 on touch (`--target-min`).
- **Don't rely on hover.** Anything shown on hover (a card's play button) must also be reachable
  by focus and by tap. Use `@media (hover: hover) and (pointer: fine)` for hover-only polish.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

## Accessibility checks

- **Reflow (WCAG 1.4.10, AA).** At 320 CSS px wide (equal to 1280 px at 400 % zoom), content must
  work with vertical scrolling only. Rails, data tables and media are the allowed exceptions.
- **Zoom (1.4.4).** Text resizes to 200 % without loss of content.
- **Orientation (1.3.4).** Both portrait and landscape work; never lock orientation.
- **Text spacing (1.4.12).** Layouts survive increased line, letter and word spacing; avoid fixed
  heights on text containers.

## Testing

- Check every screen at least at 320, 375, 768, 1024, 1280, 1440 and a very wide window (2560),
  plus a short landscape phone (for example 740 × 360).
- Drag the window width slowly through the full range to catch overflow between breakpoints.
- Confirm `document.documentElement.scrollWidth === innerWidth` (no horizontal page scroll) at each
  width, and that the footer touches the bottom of a tall window on a short page.
- Test real touch devices or emulation with touch enabled, and test at 200 % and 400 % zoom.
- Compare each width against the mock in `docs/mocks/` with the mock chrome hidden (`?chrome=0`).
- Playwright e2e tests set `test.use({ viewport })` per describe block for the wide and narrow
  cases (see `e2e/tests/responsive-shell.spec.ts`).

## Sources

- [W3C, Understanding SC 1.4.10 Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow)
- [Deque, 1.4.10 Reflow](https://dequeuniversity.com/resources/wcag2.1/1.4.10-reflow)
- [Cornell, reflow testing guidance](https://wa-reviews.hosting.cornell.edu/guidelines/38)
- [W3C, Understanding SC 2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
- [web.dev, the large, small and dynamic viewport units](https://goo.gle/3qxhne7)
- [OpenReplay, understanding dynamic viewport units](https://blog.openreplay.com/understanding-dynamic-viewport-units-css/)
- [Webflow, small, large and dynamic viewport units](https://help.webflow.com/hc/en-us/articles/33961380247443)
- [UXPin, responsive design best practices (2026)](https://www.uxpin.com/studio/blog/responsive-design-guide/)
- [DevToolbox, responsive web design best practices (2026)](https://devtoolbox.dedyn.io/blog/responsive-design-best-practices)
- [Lovable, responsive web design techniques that work](https://lovable.dev/guides/responsive-web-design-techniques-that-work)

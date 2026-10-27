"""The twelve foundation pages."""
from base import *
from comps_a import IC

FAM = [("coral", "Coral (brand)"), ("gray", "Warm neutral"), ("sky", "Sky (info)"), ("green", "Green (success)"), ("amber", "Amber (warning)"), ("red", "Red (danger)")]


def ramp(fam):
    steps = [n for n in all_tokens() if n.startswith(f"--palette-{fam}-")]
    spans = "".join(f'<span data-step="{n.rsplit("-", 1)[1]}" data-token="{n}" data-swatch></span>' for n in steps)
    vals = "".join(f'<tr><td><code>{n}</code></td><td>{tcell(n, "light")}</td></tr>' for n in steps)
    return f'<div class="ds-ramp" role="img" aria-label="{fam} ramp">{spans}</div><div class="ds-table-wrap"><table class="ds-table"><thead><tr><th scope="col">Primitive</th><th scope="col">Value</th></tr></thead><tbody>{vals}</tbody></table></div>'


def swatches(names):
    return '<div class="ds-swatches">' + "".join(f'<div class="ds-swatch"><div class="ds-swatch__chip" data-token="{n}" data-swatch></div><div class="ds-swatch__body"><span class="ds-swatch__name">{n}</span><span class="ds-swatch__value" data-token="{n}"></span></div></div>' for n in names) + "</div>"


def run():
    import json
    pairs = json.loads((ROOT / "tokens" / "contrast-pairs.json").read_text(encoding="utf-8"))["pairs"]
    # ---------------------------------------------------------- color
    prim = "".join(f"<h3>{label}</h3>{ramp(f)}" for f, label in FAM)
    prim_misc = token_table(["--palette-white", "--palette-black"], True)
    roles = [n for n in tok(["--color-"], exclude=["--color-cover", "--color-info", "--color-success", "--color-warning", "--color-danger"])]
    status = tok(["--color-info", "--color-success", "--color-warning", "--color-danger"])
    cover = tok(["--color-cover"])
    pair_html = "".join(f'<div class="ds-pair"><span><code>{p["fg"]}</code> on <code>{p["bg"]}</code> · {esc(p["note"])}</span><span class="ds-pair__ratio" data-contrast="{p["fg"]}|{p["bg"]}" data-min="{p["min"]}"></span></div>' for p in pairs)
    page("foundations", "color", "Color", "Foundation", "Coral, cream and plum ink: a warm brand palette with a cool info blue and calm status colours. Every pairing passes WCAG 2.2 AA in both themes.", "Colour primitives, semantic roles, themes and verified contrast pairs.", [
        ("overview", "Overview", "<p>Colour has three jobs: brand (coral), structure (cream and plum neutrals) and meaning (info, success, warning, danger). Components read <strong>semantic</strong> tokens only; primitives are never used directly. Dark is built from roles, not inverted: surfaces rise lighter than the canvas, coral becomes brighter, and text on coral flips to plum.</p>", None),
        ("primitives", "Primitive ramps", prim + "<h3>White and black</h3>" + prim_misc, None),
        ("roles", "Semantic roles", "<p>Each swatch shows the current theme; use the toggle to compare.</p>" + swatches(roles) + token_table(roles, True), None),
        ("status", "Status colours", "<p>Each status has five roles: <code>bg</code> (tint), <code>fg</code> (text), <code>border</code>, <code>icon</code> and <code>solid</code> (filled badge or border). Status is always paired with a word and an icon.</p>" + swatches(status) + token_table(status, True), None),
        ("covers", "Media covers", "<p>Six gradient colourways for generated artwork and genre tiles. Text and glyphs on them use <code>--color-fg-on-media</code>, which is white in both themes.</p>" + swatches(cover) + token_table(cover, True), None),
        ("themes", "Light and dark side by side", themes('<div class="card stack"><h3>Slow Orbit</h3><p class="text-muted">Lumen Fox · Ambient</p><div class="cluster"><button class="btn btn--primary" type="button">Play</button><button class="btn" type="button">Share</button><span class="badge badge--success">CC0</span></div></div>'), None),
        ("contrast", "Contrast pairs", f"<p>{len(pairs)} pairs are checked for both themes by <code>scripts/check_contrast.py</code>. Ratios below are computed live for the current theme.</p>{pair_html}", None),
        ("usage", "Usage", "<ul><li>Use <code>--color-accent</code> for the one main action per view; <code>--color-fg-accent</code> for accent-coloured text.</li><li>The pure brand coral (<code>--palette-coral-500</code>) is for the logo, favicon and large surfaces; interactive coral in light is the deeper <code>--palette-coral-600</code> so text and focus rings reach 4.5:1 on cream.</li><li>Never rely on colour alone: badges, errors and states always have text or an icon.</li><li>Add a brand theme as a <code>[data-theme=\"name\"]</code> block overriding semantic tokens only.</li></ul>", None),
    ])
    # ---------------------------------------------------------- typography
    fam = tok(["--font-family"]); sizes = tok(["--font-size"]); weights = tok(["--font-weight"]); lh = tok(["--line-height"]); ls = tok(["--letter-spacing"]); roles_t = tok(["--text-"])
    spec = lambda n, txt: f'<div class="ds-specimen"><div class="ds-specimen__meta">{n}</div><div style="font:var({n})">{txt}</div></div>'
    page("foundations", "typography", "Typography", "Foundation", "DM Sans for everything and the system monospace for code. A nine-step scale, four weights and twelve ready-made roles.", "Type families, scale, weights, line heights and role shorthands.", [
        ("overview", "Overview", "<p>Hummi sets in <strong>DM Sans</strong> (400, 500, 600, 700) with system sans-serif fallbacks. Body text is 16px; nothing is smaller than 12px. Headings use tighter line heights and balanced wrapping.</p>", None),
        ("families", "Families", f'<div class="ds-specimen"><div class="ds-specimen__meta">--font-family-sans</div><div style="font-family:var(--font-family-sans);font-size:var(--font-size-2xl)">Slow Orbit — Lumen Fox</div></div><div class="ds-specimen"><div class="ds-specimen__meta">--font-family-mono</div><div style="font-family:var(--font-family-mono)">openmusic-3b · CC0 1.0</div></div>' + token_table(fam), None),
        ("scale", "Size scale", "".join(f'<div class="ds-specimen"><div class="ds-specimen__meta">{n}</div><div style="font-size:var({n})">Music for every mood</div></div>' for n in sizes) + token_table(sizes), None),
        ("roles", "Role shorthands", "".join(spec(n, n[len("--text-"):].replace("-", " ").title() + " · Late-night coding") for n in roles_t) + token_table(roles_t), None),
        ("weights", "Weights, line heights and spacing", token_table(weights) + token_table(lh) + token_table(ls), None),
        ("usage", "Usage", "<ul><li>One <code>h1</code> per page using <code>--text-h1</code>; headings never skip levels.</li><li>Line length stays under 65 characters (<code>--layout-measure</code>).</li><li>Numbers in tables and the player use tabular figures.</li><li>On phones the display and h1 steps shrink one step; body stays 16px so mobile browsers do not zoom inputs.</li></ul>", None),
        ("accessibility", "Accessibility", "<p>Text sizes are in <code>rem</code> so browser zoom and user font settings apply. Body line height is 1.5. Large text (24px, or 18.66px bold) needs 3:1 contrast; everything else 4.5:1.</p>", None),
    ])
    # ---------------------------------------------------------- spacing
    sp = tok(["--space-"])
    px = {"0": 0, "0-5": 2}
    def sz(n):
        k = n[len("--space-"):]
        return px.get(k, int(k) * 4)
    scale = "".join(f'<div class="ds-scale__row"><code>{n}</code><span data-token="{n}"></span><div class="ds-scale__bar" style="--size:var({n})"></div></div>' for n in sp)
    page("foundations", "spacing", "Spacing", "Foundation", "A 4px scale. Small steps inside components, larger steps between them.", "The spacing scale and the rules for inside and between.", [
        ("overview", "Overview", "<p>Every gap, padding and margin is a multiple of 4px. Use ≤ <code>--space-6</code> <em>inside</em> a component and ≥ <code>--space-6</code> <em>between</em> components.</p>", None),
        ("scale", "Scale", f'<div class="ds-scale">{scale}</div>', None),
        ("rules", "Inside and between", "<ul><li>Inside: 4px between a label and its field, 8px between icon and text, 12–16px padding in rows, 24px in cards.</li><li>Between: 16px between fields, 24–40px between sections on a page, 64–96px for hero blocks.</li><li>Page gutters and margins come from layout tokens, not the scale directly.</li></ul>", None),
        ("padding", "Padding by component size", table(["Component", "Padding", "Token"], [("Button sm / md / lg", "12 / 16 / 24px inline", "<code>--space-3</code> / <code>-4</code> / <code>-6</code>"), ("Track row", "8px block, 12px inline", "<code>--space-2</code> / <code>-3</code>"), ("Card", "24px", "<code>--space-6</code>"), ("Dialog", "24px", "<code>--space-6</code>")]), None),
        ("tokens", "Tokens", token_table(sp), None),
    ])
    # ---------------------------------------------------------- layout
    lay = tok(["--layout-"])
    page("foundations", "layout", "Layout", "Foundation", "Mobile-first grid: 4, 8 and 12 columns with growing gutters and margins, a sticky sidebar from 1024px.", "Breakpoints, columns, gutters, margins and page templates.", [
        ("overview", "Overview", "<p>Layout is mobile first. Base styles target 360px; additions apply at <code>48rem</code> (768px) and <code>64rem</code> (1024px). The page never scrolls horizontally; tables and pill rows scroll inside themselves.</p>", None),
        ("breakpoints", "Breakpoints, columns, gutters and margins", table(["Breakpoint", "Min width", "Columns", "Gutter", "Margin", "Navigation"], [("Phone", "0", "4", "16px", "16px", "Menu button, sidebar hidden"), ("Tablet", "768px (48rem)", "8", "24px", "32px", "Menu button"), ("Desktop", "1024px (64rem)", "12", "32px", "48px", "Sticky 256px sidebar")]), None),
        ("grid", "Live grid", '<p>Resize the window to see the columns, gutters and margins change.</p><div class="ds-grid-demo">' + "".join(f"<span>{i}</span>" for i in range(1, 13)) + "</div>", None),
        ("container", "Container, sidebar and top bar", "<ul><li><code>--layout-container-max</code> caps content width; <code>container--narrow</code> (42rem) is for reading and forms.</li><li>The sidebar is <code>--layout-sidebar-width</code>; the top bar is <code>--layout-topbar-height</code>.</li><li>The player bar sits above content and pages add <code>has-player</code> to reserve its height.</li></ul>", None),
        ("templates", "Page templates", table(["Template", "Used by", "Structure"], [("Shell", "Home, Browse, Library, Search, Playlist", "Sidebar + top bar + <code>container</code> main + player bar"), ("Auth", "Sign in, Sign up, Reset password, Verify email", "Centred <code>auth-card</code>, no shell"), ("Settings", "Settings", "Shell, single column of cards, no player"), ("Detail", "Track, Artist, Album", "Shell with a hero then shelves"), ("Error", "404, 403, 500, Offline", "Shell with a centred empty state")]), None),
        ("usage", "Usage", "<p>Compose with <code>stack</code>, <code>cluster</code>, <code>grid</code> and <code>container</code> (see Layout primitives). Do not set widths in pixels; use tokens and fractions.</p>", None),
        ("tokens", "Tokens", token_table(lay), None),
    ])
    # ---------------------------------------------------------- elevation
    sh = tok(["--shadow"]); zz = tok(["--z-"])
    page("foundations", "elevation", "Elevation", "Foundation", "Four shadow levels and nine layers. Dark theme uses lighter surfaces and darker shadows to separate layers.", "Shadows, surfaces and z-order.", [
        ("overview", "Overview", "<p>Elevation expresses what sits above what. Cards are level 1, raised cards and dropdowns level 2, menus and popovers level 3, dialogs and sheets level 4. In dark theme, raised surfaces are also lighter than the canvas.</p>", None),
        ("shadows", "Shadow levels", '<div class="ds-shadow-grid">' + "".join(f'<div style="--shadow:var({n})">{n}</div>' for n in ["--shadow-1", "--shadow-2", "--shadow-3", "--shadow-4"]) + "</div>", None),
        ("surfaces", "Surface hierarchy", table(["Surface", "Token", "Used for"], [("Canvas", "<code>--color-bg-canvas</code>", "Page background"), ("Surface", "<code>--color-bg-surface</code>", "Cards, inputs, top bar"), ("Raised", "<code>--color-bg-surface-raised</code>", "Dialogs, menus, player"), ("Sunken", "<code>--color-bg-surface-sunken</code>", "Wells, table headers")]), None),
        ("z-order", "Z-order", table(["Layer", "Token", "Contains"], [("Base", "<code>--z-base</code>", "Page content"), ("Sticky", "<code>--z-sticky</code>", "Top bar, player bar"), ("Dropdown", "<code>--z-dropdown</code>", "Menus"), ("Overlay", "<code>--z-overlay</code>", "Backdrops"), ("Modal", "<code>--z-modal</code>", "Dialogs"), ("Toast", "<code>--z-toast</code>", "Toasts"), ("Tooltip", "<code>--z-tooltip</code>", "Tooltips")]), None),
        ("usage", "Usage", "<p>Components never set a raw z-index; they use a layer token. Do not stack more than two shadow levels in one view.</p>", None),
        ("tokens", "Tokens", token_table(sh) + token_table(zz), None),
    ])
    # ---------------------------------------------------------- shape
    rd = tok(["--radius"]); bw = tok(["--border-"])
    page("foundations", "shape", "Shape", "Foundation", "Round, friendly corners that grow with the size of the element.", "Radius scale and border widths.", [
        ("overview", "Overview", "<p>Hummi is soft. Radius increases with element size: inputs and buttons use <code>md</code>, cards and tiles <code>lg</code>, dialogs and sheets <code>xl</code>, and avatars and chips are fully round.</p>", None),
        ("radii", "Radius scale", '<div class="ds-scale">' + "".join(f'<div class="ds-scale__row"><code>{n}</code><span data-token="{n}"></span><div class="ds-scale__box" style="--size:var({n})"></div></div>' for n in rd) + "</div>", None),
        ("usage", "Which radius where", table(["Element", "Radius"], [("Checkbox", "<code>--radius-xs</code>"), ("Badge, inline code", "<code>--radius-sm</code>"), ("Button, input, menu, track row", "<code>--radius-md</code>"), ("Card, tile, cover", "<code>--radius-lg</code>"), ("Dialog, hero, sheet", "<code>--radius-xl</code>"), ("Avatar, chip, switch", "<code>--radius-full</code>")]), None),
        ("tokens", "Tokens", token_table(rd) + token_table(bw), None),
    ])
    # ---------------------------------------------------------- motion
    du = tok(["--duration"]); ea = tok(["--ease"])
    demo = lambda d, e: f'<div class="ds-motion-demo"><button class="btn" type="button" data-motion-run>Replay</button><div style="--demo-duration:var({d});--demo-ease:var({e})"><span class="dot"></span></div></div>'
    page("foundations", "motion", "Motion", "Foundation", "Short, purposeful transitions that respect reduced-motion.", "Durations, easings and replayable demos.", [
        ("overview", "Overview", "<p>Motion confirms an action or shows where something came from; it never decorates. Under <code>prefers-reduced-motion</code> the duration tokens drop to zero, so components need no extra rules.</p>", None),
        ("durations", "Durations", "".join(f'<div class="ds-example"><div class="ds-example__canvas">{demo(d, "--ease-standard")}</div><div class="ds-example__caption"><span><code>{d}</code> <span data-theme="light"><span data-token="{d}"></span></span></span></div></div>' for d in du), None),
        ("easings", "Easings", "".join(f'<div class="ds-example"><div class="ds-example__canvas">{demo("--duration-slow", e)}</div><div class="ds-example__caption"><span><code>{e}</code></span></div></div>' for e in ea), None),
        ("usage", "Usage", table(["Motion", "Duration", "Easing"], [("Hover, colour change", "fast", "standard"), ("Tooltip, menu reveal", "base", "enter / exit"), ("Dialog, sheet", "slow", "enter"), ("Skeleton shimmer, indeterminate bar", "deliberate", "standard")]), None),
        ("accessibility", "Reduced motion", "<p>With <code>prefers-reduced-motion: reduce</code>: durations are <code>0ms</code>, shimmer and spinner become static, smooth scrolling is off. Nothing flashes more than three times a second.</p>", None),
        ("tokens", "Tokens", token_table(du) + token_table(ea), None),
    ])
    # ---------------------------------------------------------- iconography
    icons = [("play", '<path d="M7 4.5v15l12-7.5z"/>'), ("pause", '<path d="M8 5v14M16 5v14"/>'), ("next", '<path d="M6 5l10 7-10 7zM19 5v14"/>'), ("heart", '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>'), ("plus", '<path d="M12 5v14M5 12h14"/>'), ("share", '<path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/>'),
             ("search", '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'), ("home", '<path d="M3 12 12 3l9 9M5 10v10h14V10"/>'), ("library", '<path d="M5 4v16M10 4v16M15 6l4 14"/>'), ("bell", '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>'), ("settings", '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>'), ("queue", '<path d="M4 6h12M4 11h12M4 16h7M17 14v6l5-3z"/>'),
             ("alert", '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>'), ("check", '<path d="m5 12 5 5 9-10"/>'), ("lock", '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'), ("offline", '<path d="M3 3l18 18M8.5 8.5A11 11 0 0 0 2 11"/>'), ("trash", '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>'), ("close", '<path d="M6 6l12 12M18 6 6 18"/>')]
    sheet = '<div class="ds-cards">' + "".join(f'<div class="ds-card"><div style="display:flex;justify-content:center">{IC(p).replace("icon", "icon icon--lg", 1)}</div><div class="ds-specimen__meta" style="text-align:center">{n}</div></div>' for n, p in icons) + "</div>"
    page("foundations", "iconography", "Iconography", "Foundation", "Line icons on a 24-unit grid with a 2px stroke, drawn in currentColor.", "Icon style, sizes, labelling and the set used in the mocks.", [
        ("overview", "Overview", "<p>Icons are inline SVG, <code>viewBox=\"0 0 24 24\"</code>, 2px stroke, round caps and joins, no fill (the play glyph is the exception). They inherit <code>currentColor</code> so they follow text and theme.</p>", None),
        ("sizes", "Sizes", '<div class="ds-example"><div class="ds-example__canvas">' + IC(icons[0][1]).replace("icon", "icon icon--sm", 1) + IC(icons[0][1]) + IC(icons[0][1]).replace("icon", "icon icon--lg", 1) + '</div><div class="ds-example__caption"><span>16px (sm), 20px (default), 24px (lg)</span></div></div>', None),
        ("set", "Icon set", sheet, None),
        ("labelling", "Labelling", "<ul><li>Decorative icons next to text: <code>aria-hidden=\"true\"</code>.</li><li>Icon-only buttons: <code>aria-label</code> on the button naming the action and object.</li><li>Meaningful standalone icons: <code>role=\"img\"</code> with a label, or hidden text.</li></ul>", None),
        ("usage", "Usage", "<p>One icon per control. Pair icons with text in navigation and primary buttons. The logo is a separate asset: see <code>assets/</code> in this folder and the brand rules in <code>docs/design-system/assets/README.md</code>.</p>", None),
    ])
    # ---------------------------------------------------------- theming
    page("foundations", "theming", "Theming", "Foundation", "Light is the default; dark follows the device or an explicit choice. Both are built from the same roles.", "How themes work and how to add one.", [
        ("overview", "Overview", "<p>Tokens come in three tiers: <strong>primitives</strong> (raw values), <strong>semantic</strong> (meaning; themes override this tier) and <strong>component</strong> tokens (scoped aliases). Changing a hue touches primitives; changing what “accent” means touches semantic tokens.</p>", None),
        ("how", "How themes apply", "<ul><li>Light is <code>:root</code>.</li><li>Dark applies with <code>[data-theme=\"dark\"]</code> and, unless the page forces light, with <code>prefers-color-scheme: dark</code>.</li><li><code>color-scheme</code> is set per theme so native controls and scrollbars follow.</li><li><code>prefers-contrast: more</code> and <code>forced-colors</code> raise borders and hand focus and borders to system colours.</li></ul>", None),
        ("demo", "Both themes", themes('<div class="card stack"><h3>Late-night coding</h3><div class="cluster"><button class="btn btn--primary" type="button">Play</button><span class="chip">Ambient</span><span class="badge badge--info">Public</span></div></div>'), None),
        ("add", "Adding a theme", "<ol><li>Copy the <code>[data-theme=\"dark\"]</code> block in <code>tokens/tokens.css</code> and rename it.</li><li>Override semantic tokens only.</li><li>Add the new pairs to <code>tokens/contrast-pairs.json</code> and run <code>check_contrast.py</code>.</li><li>Re-export with <code>tokens_to_json.py</code>.</li></ol>", None),
        ("json", "Consuming tokens.json", "<p><code>tokens/tokens.json</code> is a DTCG export (<code>$type</code>, <code>$value</code>, aliases as <code>{group.token}</code>, theme overrides under <code>$extensions</code>). Generate platform constants from it; do not hand-copy values.</p>", None),
        ("dont", "Do and don’t", "<ul><li><strong>Do</strong> change semantic tokens to re-theme.</li><li><strong>Don’t</strong> write a colour literal in a component.</li><li><strong>Don’t</strong> invert light values to make dark.</li></ul>", None),
    ])
    # ---------------------------------------------------------- responsive
    page("foundations", "responsive", "Responsive", "Foundation", "Design for 360px first, then add columns and navigation at 768px and 1024px.", "Mobile-first rules and per-component behaviour.", [
        ("overview", "Overview", "<p>Every screen is checked at 360, 768 and 1280px in both themes with no horizontal page scroll. Hover-only affordances are always visible under <code>(hover: none)</code>.</p>", None),
        ("rules", "Rules", "<ul><li>Base styles are for 360px; use <code>min-width</code> media queries.</li><li>Tables and pill rows scroll inside their wrapper.</li><li>Dialogs become bottom sheets under 640px.</li><li>The sidebar hides under 1024px behind the menu button.</li><li>Body text stays 16px; inputs are never smaller than 16px on touch.</li></ul>", None),
        ("components", "Per-component behaviour", table(["Component", "Phone", "Tablet", "Desktop"], [("Navigation", "Menu button", "Menu button", "Sidebar"), ("Player bar", "Two rows, full width", "Two rows", "Three columns beside the sidebar"), ("Media tiles", "2 columns", "4 columns", "6 columns"), ("Dialog", "Bottom sheet", "Centred panel", "Centred panel"), ("Toast", "Full width", "Bottom right", "Bottom right"), ("Hero", "Stacked", "Side by side", "Side by side")]), None),
        ("testing", "Testing matrix", table(["Width", "Height", "Themes"], [("360", "800", "Light, dark"), ("768", "1024", "Light, dark"), ("1280", "800", "Light, dark")]) + "<p>Run <code>screenshot_mocks.py docs/mocks</code> to render the matrix.</p>", None),
    ])
    # ---------------------------------------------------------- accessibility
    it = tok(["--target-", "--control-", "--focus-"])
    page("foundations", "accessibility", "Accessibility", "Foundation", "Hummi commits to WCAG 2.2 AA: contrast, keyboard, focus, labels, targets and motion.", "The accessibility commitments every component honours.", [
        ("overview", "Overview", "<p>Accessibility is part of the component contract, not a final check. Each component page documents its role, keyboard map, focus, labelling, contrast, motion and touch behaviour.</p>", None),
        ("commitments", "Commitments", "<ul class=\"ds-checklist\"><li>Text contrast 4.5:1 (3:1 for large text); UI edges and focus rings 3:1.</li><li>Everything works with a keyboard; focus is always visible (<code>:focus-visible</code> ring, 2px, offset 2px).</li><li>Every control has a name; icon-only controls have <code>aria-label</code>.</li><li>Targets are at least 24px, and 44px for primary touch controls.</li><li>Colour is never the only cue.</li><li>One <code>h1</code> per page; landmarks and a skip link on every page.</li><li>Dialogs trap focus, make the page inert and return focus; toasts live in a polite live region.</li><li>Motion respects <code>prefers-reduced-motion</code>; nothing flashes.</li></ul>", None),
        ("keyboard", "Global keyboard map", keys([("Tab / Shift+Tab", "Move between controls"), ("Space", "Play or pause (outside text fields)"), ("Esc", "Close dialog, menu or toast"), ("/", "Focus search")]), None),
        ("testing", "Testing procedure", "<ol><li>Tab through the page; the order matches reading order and the ring is always visible.</li><li>Run the contrast check on both themes.</li><li>Zoom to 200% and 400%: no loss of content.</li><li>Use a screen reader on one page, one dialog and one toast.</li></ol>", None),
        ("contract", "Component contract", "<p>A component is done when its page names the ARIA pattern, lists the keys, shows focus and both themes, and its contrast pairs are in <code>contrast-pairs.json</code>.</p>", None),
        ("tokens", "Interaction tokens", token_table(it), None),
    ])
    # ---------------------------------------------------------- content
    page("foundations", "content", "Content", "Foundation", "Warm, plain and specific. Sentence case, verbs on buttons, honest errors.", "Voice, tone and microcopy.", [
        ("overview", "Overview", "<p>Hummi sounds like a friendly record-shop regular: warm, brief and never salesy. We are honest that the music is AI-generated and openly licensed, and we say so plainly.</p>", None),
        ("voice", "Voice and tone", table(["Situation", "Tone", "Example"], [("Success", "Quiet, specific", "Added to Late-night coding."), ("Error", "Calm, owning", "We couldn’t save your changes. Try again."), ("Empty", "Encouraging", "Your library is empty. Like a track and it lives here."), ("Destructive", "Direct", "Delete “Late-night coding”? You can’t undo this.")]), None),
        ("rules", "Rules", "<ul><li>Sentence case everywhere, including buttons and titles.</li><li>Buttons are verbs: <em>Add to playlist</em>, <em>Create account</em>.</li><li>Dates read “Tue 27 Oct 2026”; durations “4:12” and “1 h 32 min”; counts use thousands separators (128,904).</li><li>No exclamation marks, no “Oops”, no blame.</li><li>Say “track”, “playlist”, “artist”; say “generated with an open-weights model” rather than “AI magic”.</li></ul>", None),
        ("errors", "Error message formula", "<p><strong>What happened</strong> + <strong>what is safe</strong> + <strong>what to do</strong>. “We couldn’t load this page. Your music hasn’t gone anywhere. Try again.”</p>", None),
        ("empty", "Empty state formula", "<p><strong>What is empty</strong> + <strong>why</strong> + <strong>one next step</strong>.</p>", None),
        ("library", "Microcopy library", table(["Where", "Copy"], [("Primary play", "Play"), ("Save a track", "Like"), ("Add to a list", "Add to playlist"), ("Sign in prompt", "Sign in to save this"), ("Offline banner", "You are offline. Showing what was saved on this device."), ("Licence line", "CC0 1.0 (public domain)")]), None),
    ])

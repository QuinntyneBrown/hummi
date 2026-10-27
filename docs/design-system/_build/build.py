"""Generate docs/design-system from the spec modules.

    python docs/design-system/_build/build.py
    python <skill>/scripts/check_design_system.py docs/design-system
    python <skill>/scripts/check_contrast.py docs/design-system/tokens/tokens.css
"""
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import base  # noqa: E402
from base import *  # noqa: E402,F403
import comp  # noqa: E402
import comps_a, comps_b, comps_c, comps_d  # noqa: E402,E401
import foundations  # noqa: E402
import patterns  # noqa: E402

SKILL = Path.home() / ".claude" / "skills" / "extracting-design-systems" / "scripts"
GROUP_ORDER = ["Actions", "Inputs", "Navigation", "Containers", "Data display", "Feedback", "Media"]

DRIFT = [
    ("assets/tokens.css", "The brand ramp was named `--palette-blue-*` although it holds coral.", "Renamed to `--palette-coral-*` everywhere."),
    ("assets/ui.css", "Cover and genre tiles used the literal `white` and reached into primitive `--palette-*` tokens.", "Added `--color-fg-on-media` and six `--color-cover-N-from/to` semantic tokens; contrast pairs added."),
    ("assets/ui.css", "A `.logo` class collided with the auth card’s `.auth-card .logo` rule and broke the dark wordmark swap.", "Renamed the image classes to `brand-logo` and `brand-logo--light/dark`."),
    ("assets/ui.css", "Off-grid values (`0.1rem`, `0.35em`, `-1px`, `2px`) in inline code, kbd and joined controls.", "Accepted: they are relative to text size or are hairline overlaps, not layout spacing."),
    ("assets/ui.css", "Breakpoints `40rem`, `47.99rem` and `63.99rem` used beside the two layout breakpoints.", "`40rem` (640px) is the dialog sheet switch and is documented in Responsive; `max-width` pairs are the complements of `48rem` and `64rem`."),
    ("pages/*/default.html", "Mobile search field shrank to a few pixels beside the spacer.", "Fixed in components.css: the spacer hides under 1024px and search grows."),
    ("assets/ui.css", "Error summary had no padding or background.", "Added padding, `--color-danger-bg` and radius to `.form-summary`."),
]


def reset():
    for f in ("foundations", "components", "patterns"):
        shutil.rmtree(base.ROOT / f, ignore_errors=True)


def index_html(specs):
    def cards(items, folder):
        return '<ul class="ds-cards" style="list-style:none;padding:0">' + "".join(f'<li class="ds-card"><a href="{folder}/{s}.html"><strong>{esc(n)}</strong></a><p class="text-muted">{esc(d)}</p></li>' for s, n, d in items) + "</ul>"
    f = [(s, n, d) for (s, n), d in zip(FOUNDATIONS, FOUND_LEADS)]
    c = [(s, n, l) for s, n, g, l in COMPONENTS]
    p = [(s, n, l) for s, n, l in PATTERNS]
    start = [("foundations/color", "Color"), ("foundations/typography", "Typography"), ("foundations/layout", "Layout"), ("components/button", "Button"), ("components/form-field", "Form field"), ("components/dialog", "Dialog")]
    st = '<ul class="ds-cards" style="list-style:none;padding:0">' + "".join(f'<li class="ds-card"><a href="{h}.html"><strong>{n}</strong></a></li>' for h, n in start) + "</ul>"
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hummi design system</title>
<meta name="description" content="Tokens, foundations, components and patterns for Hummi, a free streaming platform for open-source AI music.">
<link rel="stylesheet" href="tokens/tokens.css">
<link rel="stylesheet" href="assets/components.css">
<link rel="stylesheet" href="assets/ds.css">
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>
<main id="main" class="ds-main" style="max-width:72rem;margin-inline:auto">
<header class="ds-header"><p class="ds-kicker">Design system</p><h1>Hummi design system</h1>
<p class="ds-lead">The visual and interaction language of Hummi: coral, cream and plum, soft shapes, DM Sans and a persistent player. Extracted from the mocks, checked for WCAG 2.2 AA in both themes.</p>
<div class="ds-meta"><span class="ds-pill ds-pill--ok">WCAG 2.2 AA</span><span class="ds-pill">{len(c)} components</span><span class="ds-pill">{len(p)} patterns</span><button class="ds-theme-toggle" type="button" aria-pressed="false">☾ Dark</button></div></header>
<section class="ds-section" id="start"><h2><a href="#start">Start here</a></h2>{st}</section>
<section class="ds-section" id="foundations"><h2><a href="#foundations">Foundations</a></h2>{cards(f, "foundations")}</section>
<section class="ds-section" id="components"><h2><a href="#components">Components</a></h2>{cards(c, "components")}</section>
<section class="ds-section" id="patterns"><h2><a href="#patterns">Patterns</a></h2>{cards(p, "patterns")}</section>
<section class="ds-section" id="use"><h2><a href="#use">How to use</a></h2><ol><li>Link <code>tokens/tokens.css</code> then <code>assets/components.css</code>.</li><li>Use the documented classes and <code>data-theme</code> for dark mode; never write colours or sizes in a feature.</li><li>Generate platform constants from <code>tokens/tokens.json</code>.</li><li>In Angular, <code>@hummi/components</code> wraps these classes; if something is missing, add it here first.</li></ol></section>
<section class="ds-section" id="provenance"><h2><a href="#provenance">Provenance</a></h2><p>Extracted on {TODAY} from <a href="../mocks/index.html">docs/mocks</a>. Brand identity: <a href="assets/README.md">logo v1 and palette</a>. Generated by <code>_build/build.py</code>; do not hand-edit the pages.</p></section>
<footer class="ds-footer"><span>Hummi design system</span><a href="#top">Back to top</a></footer>
</main>
<script src="assets/ds.js"></script>
</body>
</html>
'''


FOUND_LEADS = ["Brand ramps, roles, status and verified contrast.", "DM Sans, the scale and roles.", "The 4px scale and its rules.", "Breakpoints, grid, templates.", "Shadows, surfaces, z-order.",
               "Radii and borders.", "Durations, easings, reduced motion.", "Icon style and set.", "How light, dark and brand themes work.", "Mobile-first rules.", "WCAG 2.2 AA commitments.", "Voice, tone and microcopy."]


def readme(specs, pats):
    comp_rows = "\n".join(f"| [{s['name']}](components/{s['slug']}.html) | {s['group']} | {', '.join(l for l, _ in s['variants'][:4])} | {', '.join(m.split('/')[-2] + '/' + m.split('/')[-1] if m.count('/') else m for m in s['sources'][:2])} |" for s in specs)
    found_rows = "\n".join(f"| [{n}](foundations/{s}.html) | {d} |" for (s, n), d in zip(FOUNDATIONS, FOUND_LEADS))
    pat_rows = "\n".join(f"| [{p['name']}](patterns/{p['slug']}.html) | {p['lead']} |" for p in pats)
    drift = "\n".join(f"| `{a}` | {b} | {c} |" for a, b, c in DRIFT)
    return f'''# Hummi design system

Extracted from [docs/mocks](../mocks/README.md) on {TODAY}. Open [index.html](index.html) locally. Brand identity (logo v1, palette) lives in [assets/README.md](assets/README.md).

## Foundations

| Page | Covers |
|---|---|
{found_rows}

## Components

| Component | Group | Variants | Source mocks |
|---|---|---|---|
{comp_rows}

## Patterns

| Pattern | Covers |
|---|---|
{pat_rows}

## Tokens

- `tokens/tokens.css`: source of truth (primitives, semantic tokens, light and dark themes).
- `tokens/tokens.json`: DTCG export generated by `tokens_to_json.py`.
- `tokens/contrast-pairs.json`: every foreground/background pairing the components rely on.
- `assets/components.css`: the product stylesheet; the mocks link it too.

## Drift found in the mocks

| Mock or file | Issue | Resolution |
|---|---|---|
{drift}

## Regenerating

```sh
python docs/design-system/_build/build.py
python ~/.claude/skills/extracting-design-systems/scripts/check_design_system.py docs/design-system
python ~/.claude/skills/extracting-design-systems/scripts/check_contrast.py docs/design-system/tokens/tokens.css
```

## Verification

{VERIFY}
'''


VERIFY = "See the verification record appended by the last run."


def main():
    global VERIFY
    specs = []
    for m in (comps_a, comps_b, comps_c, comps_d):
        specs += m.SPECS
    specs.sort(key=lambda s: GROUP_ORDER.index(s["group"]))
    for s in specs:
        COMPONENTS.append((s["slug"], s["name"], s["group"], s["lead"]))
    patterns.run()
    reset()
    foundations.run()
    for s in specs:
        comp.component(s)
    patterns.render()
    (base.ROOT / "index.html").write_text(index_html(specs), encoding="utf-8", newline="\n")
    vf = base.ROOT / "_build" / "verification.md"
    VERIFY = vf.read_text(encoding="utf-8").strip() if vf.exists() else "Not yet run."
    (base.ROOT / "README.md").write_text(readme(specs, patterns.PATS), encoding="utf-8", newline="\n")
    subprocess.run([sys.executable, str(SKILL / "tokens_to_json.py"), str(base.ROOT / "tokens" / "tokens.css")], check=False)
    print(f"{len(FOUNDATIONS)} foundations, {len(specs)} components, {len(patterns.PATS)} patterns")


if __name__ == "__main__":
    main()

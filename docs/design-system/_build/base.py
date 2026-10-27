"""Framework for the Hummi design-system generator: page shell, nav, sections, token tables.

Edit the foundations/components/patterns modules, then run `python docs/design-system/_build/build.py`.
"""
import itertools
import re
from html import escape as esc
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PRODUCT = "Hummi"
TODAY = "2026-10-27"

FOUNDATIONS = [("color", "Color"), ("typography", "Typography"), ("spacing", "Spacing"), ("layout", "Layout"), ("elevation", "Elevation"),
               ("shape", "Shape"), ("motion", "Motion"), ("iconography", "Iconography"), ("theming", "Theming"), ("responsive", "Responsive"),
               ("accessibility", "Accessibility"), ("content", "Content")]
COMPONENTS = []   # (slug, name, group, lead) appended by component specs
PATTERNS = []     # (slug, name, lead)
_ids = itertools.count(1)


def uid(prefix="x"):
    return f"{prefix}{next(_ids)}"


# ------------------------------------------------------------------ tokens
def all_tokens():
    t = (ROOT / "tokens" / "tokens.css").read_text(encoding="utf-8")
    out = []
    for n in re.findall(r"^\s*(--[a-z0-9-]+)\s*:", t, re.M):
        if n not in out:
            out.append(n)
    return out


def tok(prefixes, exclude=()):
    return [n for n in all_tokens() if any(n.startswith(p) for p in prefixes) and not any(n.startswith(e) for e in exclude)]


def tcell(name, theme):
    return f'<span class="ds-swatch-cell" data-theme="{theme}"><i data-token="{name}" data-swatch></i><span data-token="{name}"></span></span>'


def vcell(name, theme):
    return f'<span data-theme="{theme}"><span data-token="{name}"></span></span>'


def token_table(names, colour=False, note=None):
    cell = tcell if colour else vcell
    rows = "".join(f'<tr><td><code>{n}</code></td><td>{cell(n, "light")}</td><td>{cell(n, "dark")}</td>' + (f'<td>{note(n)}</td>' if note else "") + "</tr>" for n in names)
    extra = "<th>Use</th>" if note else ""
    return f'<div class="ds-table-wrap"><table class="ds-table"><thead><tr><th scope="col">Token</th><th scope="col">Light</th><th scope="col">Dark</th>{extra}</tr></thead><tbody>{rows}</tbody></table></div>'


def pair(label, fg, bg, mn=4.5, theme=None):
    wrap = f' data-theme="{theme}"' if theme else ""
    return f'<div class="ds-pair"{wrap}><span>{esc(label)}</span><span class="ds-pair__ratio" data-contrast="{fg}|{bg}" data-min="{mn}"></span></div>'


# ------------------------------------------------------------------ shell
def nav_html():
    f = "".join(f'<li><a href="../foundations/{s}.html">{n}</a></li>' for s, n in FOUNDATIONS)
    groups = {}
    for s, n, g, _ in COMPONENTS:
        groups.setdefault(g, []).append((s, n))
    c = ""
    for g, items in groups.items():
        c += f'<li class="ds-nav__group">{esc(g)}</li>' + "".join(f'<li><a href="../components/{s}.html">{n}</a></li>' for s, n in items)
    p = "".join(f'<li><a href="../patterns/{s}.html">{n}</a></li>' for s, n, _ in PATTERNS)
    return (f'<nav class="ds-nav" aria-label="Design system"><div class="ds-nav__brand"><a href="../index.html">{PRODUCT} DS</a>'
            f'<button class="ds-theme-toggle" type="button" aria-pressed="false">☾ Dark</button></div>'
            f'<details open><summary>Foundations</summary><ul>{f}</ul></details><details open><summary>Components</summary><ul>{c}</ul></details>'
            f'<details open><summary>Patterns</summary><ul>{p}</ul></details></nav>')


def sec(sid, title, body="", na=None):
    if na:
        return f'<section class="ds-section ds-na" id="{sid}" data-na="{esc(na)}"><h2><a href="#{sid}">{esc(title)}</a></h2><p>Not applicable: {esc(na)}</p></section>'
    return f'<section class="ds-section" id="{sid}"><h2><a href="#{sid}">{esc(title)}</a></h2>{body}</section>'


def page(folder, slug, title, kicker, lead, desc, sections, pills=("Status: stable",)):
    """sections: list of (id, title, body_html, na_reason|None)."""
    toc = "".join(f'<li><a href="#{i}">{esc(t)}</a></li>' for i, t, _, _ in sections)
    body = "".join(sec(i, t, b, n) for i, t, b, n in sections)
    pl = '<span class="ds-pill ds-pill--ok">WCAG 2.2 AA</span>' + "".join(f'<span class="ds-pill">{esc(p)}</span>' for p in pills)
    html = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)} — {PRODUCT} design system</title>
<meta name="description" content="{esc(desc)}">
<link rel="stylesheet" href="../tokens/tokens.css">
<link rel="stylesheet" href="../assets/components.css">
<link rel="stylesheet" href="../assets/ds.css">
</head>
<body id="top">
<a class="skip-link" href="#main">Skip to content</a>
<div class="ds-shell">
{nav_html()}
<main id="main" class="ds-main">
<header class="ds-header"><p class="ds-kicker">{esc(kicker)}</p><h1>{esc(title)}</h1><p class="ds-lead">{lead}</p><div class="ds-meta">{pl}</div><ul class="ds-toc">{toc}</ul></header>
{body}
<footer class="ds-footer"><span>{PRODUCT} design system · extracted from <a href="../../mocks/index.html">docs/mocks</a></span><a href="#top">Back to top</a></footer>
</main>
</div>
<script src="../assets/ds.js"></script>
</body>
</html>
'''
    out = ROOT / folder / f"{slug}.html"
    out.parent.mkdir(exist_ok=True)
    out.write_text(html, encoding="utf-8", newline="\n")


# ------------------------------------------------------------------ example helpers
def example(canvas, caption="", code=None, cls=""):
    cap = f'<div class="ds-example__caption"><span>{caption}</span></div>' if caption else ""
    c = f'<details class="ds-example__code"><summary>HTML</summary><pre><code>{esc(code)}</code></pre></details>' if code else ""
    return f'<div class="ds-example"><div class="ds-example__canvas {cls}">{canvas}</div>{cap}{c}</div>'


def themes(inner):
    return f'<div class="ds-themes"><div data-theme="light">{inner}</div><div data-theme="dark">{inner}</div></div>'


def table(head, rows, cls="ds-table"):
    th = "".join(f'<th scope="col">{h}</th>' for h in head)
    tr = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>" for r in rows)
    return f'<div class="ds-table-wrap"><table class="{cls}"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table></div>'


def keys(rows):
    return table(["Key", "Action"], [(f"<kbd>{k}</kbd>", a) for k, a in rows], "ds-table ds-keys")


def dodont(items):
    out = ""
    for good, gcap, bad, bcap in items:
        out += (f'<div class="ds-dodont"><figure class="ds-do"><div class="ds-example__canvas">{good}</div><figcaption>{gcap}</figcaption></figure>'
                f'<figure class="ds-dont"><div class="ds-example__canvas">{bad}</div><figcaption>{bcap}</figcaption></figure></div>')
    return out


def mock_links(paths):
    return "<ul>" + "".join(f'<li><a href="../../mocks/{p}.html">{p}</a></li>' for p in paths) + "</ul>"

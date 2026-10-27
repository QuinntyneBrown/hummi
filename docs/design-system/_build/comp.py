"""Component page renderer: turns a compact spec dict into the thirteen standard sections."""
from base import *

STATE_COLS = [("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Active", ' data-state="active"'), ("Disabled", " disabled")]


def matrix(rows, cols):
    head = "".join(f'<th scope="col">{c}</th>' for c, _ in cols)
    body = ""
    for label, tpl in rows:
        body += f'<tr><th scope="row">{label}</th>' + "".join(f"<td>{tpl.replace('{a}', a)}</td>" for _, a in cols) + "</tr>"
    return f'<div class="ds-matrix"><table><thead><tr><th scope="col">Variant</th>{head}</tr></thead><tbody>{body}</tbody></table></div>'


def component(s):
    slug, name = s["slug"], s["name"]
    parts = s["parts"]
    fig = s.get("figure") or s["variants"][0][1]
    n = len(parts)
    callouts = "".join(f'<span class="ds-callout" style="left: {8 + i * (80 // max(n, 1))}%; top: 6%;" aria-hidden="true">{i + 1}</span>' for i in range(n))
    anatomy = (f'<div class="ds-anatomy"><figure class="ds-anatomy__figure">{fig}{callouts}</figure><ol class="ds-anatomy__list">'
               + "".join(f"<li><div><b>{esc(a)}</b><small>{b}</small></div></li>" for a, b in parts) + "</ol></div>")
    variants = f'<p>{s.get("variants_note", "")}</p>' + "".join(example(h, l, h) for l, h in s["variants"])
    sizes_html = None
    if s.get("sizes"):
        sizes_html = "".join(example(h, l, h) for l, h in s["sizes"])
    st = s.get("states")
    if st:
        cols = st.get("cols", STATE_COLS)
        states = matrix(st["rows"], cols) + (st.get("extra", "")) + f'<h3>Both themes</h3>{themes(st.get("theme_demo") or st["rows"][0][1].replace("{a}", ""))}'
    else:
        states = themes(s["variants"][0][1]) if s.get("themes_demo", True) else ""
    a = s["a11y"]
    pairs = "".join(pair(l, f, b, m) for l, f, b, m in a.get("pairs", []))
    a11y = (f'<h3>Role and pattern</h3><p>{a["role"]}</p><h3>Keyboard</h3>{keys(a["keys"])}<h3>Focus</h3><p>{a["focus"]}</p>'
            f'<h3>Labelling</h3><p>{a["label"]}</p><h3>Contrast</h3>{pairs or "<p>Inherits text and surface pairs from the colour foundation.</p>"}'
            f'<h3>Motion</h3><p>{a.get("motion", "No motion beyond colour transitions, which collapse to zero under <code>prefers-reduced-motion</code>.")}</p>'
            f'<h3>Touch</h3><p>{a.get("touch", "Targets are at least 24px and 44px on touch-primary controls.")}</p>')
    toks = s["tokens"]
    tok_rows = "".join(f'<tr><td>{esc(p)}</td><td><code>{t}</code></td><td>{tcell(t, "light") if t.startswith("--color") else vcell(t, "light")}</td><td>{tcell(t, "dark") if t.startswith("--color") else vcell(t, "dark")}</td></tr>' for p, t in toks)
    tokens = f'<div class="ds-table-wrap"><table class="ds-table"><thead><tr><th scope="col">Part</th><th scope="col">Token</th><th scope="col">Light</th><th scope="col">Dark</th></tr></thead><tbody>{tok_rows}</tbody></table></div>'
    code = s.get("code") or "\n\n".join(h for _, h in s["variants"][:2])
    classes = table(["Class / attribute", "Effect"], [(f"<code>{c}</code>", e) for c, e in s["classes"]])
    drift = s.get("drift", "None found; the mocks already used this component consistently.")
    dd = dodont(s["dodont"])
    sections = [
        ("overview", "Overview", f'<p>{s["overview"]}</p>', None),
        ("anatomy", "Anatomy", anatomy, None),
        ("variants", "Variants", variants, None),
        ("sizes", "Sizes", sizes_html or "", None if sizes_html else s.get("sizes_na", "It has a single size.")),
        ("states", "States", states, None),
        ("responsive", "Responsive behaviour", s["responsive"], None),
        ("theming", "Theming", f'<p>{s.get("theming", "")} Component tokens alias semantic tokens only; re-theme by overriding the semantic tokens, never the component CSS.</p>{themes(s["variants"][0][1])}', None),
        ("accessibility", "Accessibility", a11y, None),
        ("content", "Content", s["content"], None),
        ("do-dont", "Do and don’t", dd, None),
        ("tokens", "Tokens", tokens, None),
        ("code", "Code", f'<pre><code>{esc(code)}</code></pre>{classes}', None),
        ("sources", "Sources", f'<p>Mocks this component was extracted from:</p>{mock_links(s["sources"])}<p>Drift fixed during extraction: {drift}</p>', None),
    ]
    page("components", slug, name, f'Component · {s["group"]}', s["lead"], s["lead"], sections)

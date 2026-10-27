"""Shared helpers for the Hummi mock generator: cast, icons, shell, state blocks, file skeleton.

Edit the screens_*.py files and run `python docs/mocks/_build/build.py`; never hand-edit the HTML.
"""
from html import escape as esc

PROJECT = "Hummi"
TODAY = "Tue 27 Oct 2026"

# ---------------------------------------------------------------- cast & catalog
USERS = {
    "me": {"name": "Priya Natarajan", "initials": "PN", "handle": "priya"},
    "jonah": {"name": "Jonah Adeyemi", "initials": "JA", "handle": "jonah"},
    "mei": {"name": "Mei Rodríguez", "initials": "MR", "handle": "mei"},
}
ARTISTS = [
    {"id": "lumen-fox", "name": "Lumen Fox", "genre": "Ambient", "model": "openmusic-3b", "listeners": "48,210", "cover": "c1"},
    {"id": "paper-satellites", "name": "Paper Satellites", "genre": "Lo-fi", "model": "openmusic-3b", "listeners": "31,904", "cover": "c2"},
    {"id": "nocturne-7", "name": "Nocturne 7", "genre": "Synthwave", "model": "synthbloom-1.5", "listeners": "22,576", "cover": "c5"},
    {"id": "marlow", "name": "Marlow & the Machines", "genre": "Jazz", "model": "swingnet-open", "listeners": "12,038", "cover": "c3"},
    {"id": "tidepool-choir", "name": "Tidepool Choir", "genre": "Folk", "model": "openmusic-3b", "listeners": "9,481", "cover": "c4"},
    {"id": "velvet-static", "name": "Velvet Static", "genre": "Electronic", "model": "synthbloom-1.5", "listeners": "17,322", "cover": "c6"},
]
A = {a["id"]: a for a in ARTISTS}
LICENCES = {"CC0": "CC0 1.0 (public domain)", "CC-BY": "CC BY 4.0", "CC-BY-SA": "CC BY-SA 4.0"}
TRACKS = [
    # id, title, artist, album, genre, duration, licence, plays
    ("slow-orbit", "Slow Orbit", "lumen-fox", "Night Garden", "Ambient", "4:12", "CC0", "128,904"),
    ("glass-rain", "Glass Rain", "lumen-fox", "Night Garden", "Ambient", "3:48", "CC0", "96,311"),
    ("paper-planes", "Paper Planes at 2 a.m.", "paper-satellites", "Study Hall", "Lo-fi", "2:56", "CC-BY", "212,450"),
    ("cold-coffee", "Cold Coffee", "paper-satellites", "Study Hall", "Lo-fi", "3:05", "CC-BY", "174,022"),
    ("neon-meridian", "Neon Meridian", "nocturne-7", "Overpass", "Synthwave", "3:41", "CC-BY-SA", "88,730"),
    ("last-exit", "Last Exit to Everywhere", "nocturne-7", "Overpass", "Synthwave", "4:27", "CC-BY-SA", "61,208"),
    ("blue-hour-bounce", "Blue Hour Bounce", "marlow", "Small Hours", "Jazz", "5:02", "CC-BY", "40,115"),
    ("tidewater-waltz", "Tidewater Waltz", "tidepool-choir", "Salt & Slate", "Folk", "3:33", "CC0", "27,640"),
    ("static-bloom", "Static Bloom", "velvet-static", "Signal Flowers", "Electronic", "3:58", "CC-BY", "55,903"),
    ("a-very-long-title", "The Quiet Between Two Lighthouses, Revisited (Extended Dream Mix)", "marlow", "Small Hours", "Jazz", "7:19", "CC-BY", "1,204"),
]
T = {t[0]: dict(zip(["id", "title", "artist", "album", "genre", "dur", "licence", "plays"], t)) for t in TRACKS}
NOW = "slow-orbit"
GENRES = [("Ambient", "c1"), ("Lo-fi", "c2"), ("Synthwave", "c5"), ("Jazz", "c3"), ("Folk", "c4"), ("Electronic", "c6"),
          ("Classical", "c2"), ("Cinematic", "c1"), ("Hip hop", "c6"), ("Chiptune", "c3")]
PLAYLISTS = [
    ("late-night-coding", "Late-night coding", "me", 24, "c1"),
    ("rain-on-the-window", "Rain on the window", "me", 18, "c2"),
    ("sunday-kitchen", "Sunday kitchen", "mei", 31, "c4"),
]

# ---------------------------------------------------------------- icons
_I = {
    "play": '<path d="M7 4.5v15l12-7.5z"/>', "pause": '<path d="M8 5v14M16 5v14"/>',
    "next": '<path d="M6 5l10 7-10 7zM19 5v14"/>', "prev": '<path d="M18 5 8 12l10 7zM5 5v14"/>',
    "heart": '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
    "plus": '<path d="M12 5v14M5 12h14"/>', "share": '<path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/>',
    "more": '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>',
    "search": '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>', "home": '<path d="M3 12 12 3l9 9M5 10v10h14V10"/>',
    "compass": '<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5z"/>',
    "library": '<path d="M5 4v16M10 4v16M15 6l4 14"/>', "bell": '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>',
    "settings": '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3.9a7 7 0 0 0-1.7-1L14.5 3h-5l-.4 2.4a7 7 0 0 0-1.7 1L5.1 5.5l-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 1.7 1l.4 2.4h5l.4-2.4a7 7 0 0 0 1.7-1l2.3.9 2-3.4-2-1.5c.1-.3.1-.7.1-1z"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>', "close": '<path d="M6 6l12 12M18 6 6 18"/>',
    "queue": '<path d="M4 6h12M4 11h12M4 16h7M17 14v6l5-3z"/>', "volume": '<path d="M4 9v6h4l5 4V5L8 9zM17 9a4 4 0 0 1 0 6"/>',
    "shuffle": '<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M19 4l2 3-2 3M19 14l2 3-2 3"/>',
    "repeat": '<path d="M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3"/>',
    "check": '<path d="m5 12 5 5 9-10"/>', "alert": '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>',
    "info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>', "ok": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
    "music": '<path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z"/>',
    "offline": '<path d="M3 3l18 18M8.5 8.5A11 11 0 0 0 2 11m6 3a6 6 0 0 1 4-1.5M12 19h.01M16 11a11 11 0 0 1 6 0"/>',
    "lock": '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    "link": '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    "flag": '<path d="M5 21V4h12l-2 4 2 4H5"/>', "trash": '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', "back": '<path d="m15 5-7 7 7 7"/>',
    "chev": '<path d="m9 5 7 7-7 7"/>', "cc": '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5a3 3 0 1 0 0 5"/>',
    "keyboard": '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
    "logout": '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>', "refresh": '<path d="M20 11a8 8 0 1 0-2 5.3M20 4v7h-7"/>',
}


def icon(name, cls="", fill=False):
    c = ("icon " + cls).strip()
    extra = ' fill="currentColor"' if fill else ""
    return f'<svg class="{c}" aria-hidden="true" viewBox="0 0 24 24"{extra}>{_I[name]}</svg>'


# ---------------------------------------------------------------- link context
_ctx = {"pages": "../"}


def set_pages_prefix(p):
    _ctx["pages"] = p


def P(sid, state="default"):
    return f"{_ctx['pages']}{sid}/{state}.html"


# ---------------------------------------------------------------- small blocks
def cover(cls="c1", size="", label=None):
    s = f" cover--{size}" if size else ""
    return f'<div class="cover cover--{cls}{s}" aria-hidden="true">{icon("music")}</div>'


def btn(label, kind="", ic=None, attrs="", href=None, size=""):
    k = " ".join(x for x in ["btn", f"btn--{kind}" if kind else "", f"btn--{size}" if size else ""] if x)
    i = icon(ic) if ic else ""
    if href:
        return f'<a class="{k}" href="{href}"{attrs}>{i}{label}</a>'
    return f'<button class="{k}" type="button"{attrs}>{i}{label}</button>'


def ibtn(label, ic, attrs="", kind="ghost"):
    return f'<button class="btn btn--{kind} btn--icon" type="button" aria-label="{esc(label)}"{attrs}>{icon(ic)}</button>'


def track_row(tid, n, playing=False, extra_actions="", liked=False):
    t = T[tid]
    a = A[t["artist"]]
    cur = ' aria-current="true"' if playing else ""
    num = f'<span class="eq" role="img" aria-label="Playing"><span></span><span></span><span></span></span>' if playing else str(n)
    heart = ibtn(("Remove like from " if liked else "Like ") + t["title"], "heart", f' aria-pressed="{"true" if liked else "false"}"')
    return (f'<li class="track"{cur}><span class="track__num">{num}</span>{cover(a["cover"], "sm")}'
            f'<div style="min-width:0"><div class="track__title"><a href="{P("track")}" style="color:inherit;text-decoration:none">{esc(t["title"])}</a></div>'
            f'<div class="track__meta">{esc(a["name"])} · {t["dur"]}</div></div>'
            f'<div class="track__actions">{heart}{extra_actions}{ibtn("More actions for " + t["title"], "more")}</div></li>')


def track_list(tids, playing=None, label="Tracks", liked=()):
    rows = "".join(track_row(t, i + 1, t == playing, liked=t in liked) for i, t in enumerate(tids))
    return f'<ol class="track-list" aria-label="{esc(label)}">{rows}</ol>'


def tile(tid_or_pl, kind="track"):
    if kind == "track":
        t = T[tid_or_pl]; a = A[t["artist"]]
        return (f'<a class="tile" href="{P("track")}">{cover(a["cover"])}<div class="tile__title truncate">{esc(t["title"])}</div>'
                f'<div class="tile__meta truncate">{esc(a["name"])}</div></a>')
    if kind == "artist":
        a = A[tid_or_pl]
        return (f'<a class="tile" href="{P("artist")}"><div class="cover cover--{a["cover"]} round" aria-hidden="true">{icon("user")}</div>'
                f'<div class="tile__title truncate">{esc(a["name"])}</div><div class="tile__meta">{a["listeners"]} monthly listeners</div></a>')
    pid, name, owner, n, cv = tid_or_pl
    return (f'<a class="tile" href="{P("playlist")}">{cover(cv)}<div class="tile__title truncate">{esc(name)}</div>'
            f'<div class="tile__meta">{n} tracks · {esc(USERS[owner]["name"])}</div></a>')


def shelf(title, inner, more=None):
    link = f'<a href="{more}">See all</a>' if more else ""
    hid = "sh-" + "".join(c for c in title.lower() if c.isalnum())
    return f'<section class="shelf" aria-labelledby="{hid}"><div class="cluster cluster--between"><h2 id="{hid}" style="font:var(--text-h3)">{esc(title)}</h2>{link}</div>{inner}</section>'


def skel_tiles(n=6):
    one = '<div class="tile" aria-hidden="true"><div class="skeleton skeleton--rect" style="aspect-ratio:1"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>'
    return f'<div class="tile-grid" aria-busy="true" aria-label="Loading">{one * n}</div>'


def skel_rows(n=6):
    one = ('<li class="track" aria-hidden="true"><span></span><div class="skeleton skeleton--rect" style="width:3rem;height:3rem"></div>'
           '<div><div class="skeleton skeleton--text" style="width:50%"></div><div class="skeleton skeleton--text" style="width:30%"></div></div><span></span></li>')
    return f'<ol class="track-list" aria-busy="true" aria-label="Loading tracks">{one * n}</ol>'


def empty(ic, title, text, action=""):
    act = f'<div class="empty__actions">{action}</div>' if action else ""
    return f'<div class="empty"><div class="empty__icon">{icon(ic)}</div><h2 class="empty__title">{esc(title)}</h2><p class="text-muted">{text}</p>{act}</div>'


def error_block(title, text, retry_href="default.html", extra=""):
    return (f'<div class="empty empty--error" role="alert"><div class="empty__icon">{icon("alert")}</div>'
            f'<h2 class="empty__title">{esc(title)}</h2><p class="text-muted">{text}</p>'
            f'<div class="empty__actions">{btn("Try again", "primary", "refresh", href=retry_href)}{extra}</div></div>')


def page_header(title, sub="", actions=""):
    s = f'<p class="subtitle">{sub}</p>' if sub else ""
    a = f'<div class="cluster">{actions}</div>' if actions else ""
    return f'<div class="page-header"><div><h1>{esc(title)}</h1>{s}</div>{a}</div>'


def breadcrumb(*items):
    li = "".join(f'<li><a href="{h}">{esc(t)}</a></li>' for t, h in items[:-1]) + f'<li aria-current="page">{esc(items[-1])}</li>'
    return f'<nav aria-label="Breadcrumb"><ol class="breadcrumb">{li}</ol></nav>'


def field(label, name, typ="text", value="", help="", error="", extra="", req=False):
    inv = ' aria-invalid="true"' if error else ""
    desc = []
    if help: desc.append(f"{name}-help")
    if error: desc.append(f"{name}-err")
    dd = f' aria-describedby="{" ".join(desc)}"' if desc else ""
    r = " required" if req else ""
    h = f'<span class="field__help" id="{name}-help">{help}</span>' if help else ""
    e = f'<span class="field__error" id="{name}-err">{icon("alert", "icon--sm")}{error}</span>' if error else ""
    return (f'<div class="field"><label class="field__label" for="{name}">{label}</label>'
            f'<input class="input" id="{name}" name="{name}" type="{typ}" value="{esc(value)}"{inv}{dd}{r}{extra}>{h}{e}</div>')


def summary(errors):
    li = "".join(f'<li><a href="#{i}">{m}</a></li>' for i, m in errors)
    return f'<div class="form-summary" role="alert" tabindex="-1"><strong>Fix {len(errors)} thing{"s" if len(errors) != 1 else ""} to continue</strong><ul>{li}</ul></div>'


def alert(kind, title, text, ic=None):
    ic = ic or {"info": "info", "success": "ok", "warning": "alert", "danger": "alert"}[kind]
    role = ' role="alert"' if kind == "danger" else ""
    return f'<div class="alert alert--{kind}"{role}>{icon(ic)}<div class="alert__body"><div class="alert__title">{esc(title)}</div><div>{text}</div></div></div>'


def toast_html(kind, title, text, action="", progress=True, ic=None):
    ic = ic or {"info": "info", "success": "ok", "warning": "alert", "danger": "alert"}[kind]
    act = f'<button class="toast__action" type="button">{action}</button>' if action else ""
    prog = '<span class="toast__progress" aria-hidden="true"></span>' if progress else ""
    role = ' role="alert"' if kind == "danger" else ""
    return (f'<div class="toast toast--{kind}"{role}>{icon(ic)}<div class="toast__body"><div class="toast__title">{esc(title)}</div>'
            f'<div class="toast__text">{text}</div>{act}</div>'
            f'<button class="close" type="button" aria-label="Dismiss">{icon("close", "icon--sm")}</button>{prog}</div>')


def note(text, pos="top: 5rem; right: 1rem;"):
    return f'<p class="mock-note" style="{pos}">{text}</p>'


# ---------------------------------------------------------------- app shell
NAV = [("home", "Home", "home"), ("browse", "Browse", "compass"), ("search", "Search", "search"),
       ("library", "Library", "library"), ("notifications", "Notifications", "bell")]


def player_bar(tid=NOW, playing=True, disabled=False, error=False):
    t = T[tid]; a = A[t["artist"]]
    pp = ibtn("Pause" if playing else "Play", "pause" if playing else "play", kind="primary", attrs=" disabled" if disabled else "")
    dis = " disabled" if disabled else ""
    msg = f'<div class="track__meta" style="color:var(--color-danger-fg)">Playback stopped. Check your connection.</div>' if error else f'<div class="track__meta">{esc(a["name"])}</div>'
    return (f'<section class="player" aria-label="Player">'
            f'<a class="player__now" href="{P("now-playing")}">{cover(a["cover"], "sm")}<div style="min-width:0"><div class="track__title">{esc(t["title"])}</div>{msg}</div></a>'
            f'<div class="player__controls">{ibtn("Previous track", "prev", dis)}{pp}{ibtn("Next track", "next", dis)}</div>'
            f'<div class="player__scrub scrub"><span>1:24</span><div class="progress" role="progressbar" aria-label="Track position" aria-valuemin="0" aria-valuemax="252" aria-valuenow="84"><div class="progress__bar" style="width:33%"></div></div><span>{t["dur"]}</span></div>'
            f'<div class="player__extra">{ibtn("Queue", "queue")}{ibtn("Volume", "volume")}</div></section>')


def shell(active, main, player=True, player_kw=None, banner="", search_value="", signed_in=True, extra_after=""):
    nav = ""
    for sid, label, ic in NAV:
        cur = ' aria-current="page"' if sid == active else ""
        badge = ' <span class="badge badge--count" aria-label="3 unread">3</span>' if sid == "notifications" and signed_in else ""
        nav += f'<a class="nav-link" href="{P(sid)}"{cur}>{icon(ic)}{label}{badge}</a>'
    if signed_in:
        who = (f'<div class="sidebar__group">Account</div><a class="nav-link" href="{P("settings")}"'
               f'{" aria-current=\"page\"" if active == "settings" else ""}>{icon("settings")}Settings</a>')
        right = (f'<a class="btn btn--ghost btn--icon" href="{P("notifications")}" aria-label="Notifications, 3 unread">{icon("bell")}</a>'
                 f'<a class="avatar avatar--sm" href="{P("settings")}" aria-label="Account: {USERS["me"]["name"]}">{USERS["me"]["initials"]}</a>')
    else:
        who = ""
        right = btn("Sign in", href=P("sign-in")) + btn("Sign up", "primary", href=P("sign-up"))
    logo = (f'<a class="topbar__brand" href="{P("home")}" aria-label="Hummi home">'
            f'<img class="logo logo--light" src="../../assets/brand/hummi-wordmark-coral.svg" alt="Hummi">'
            f'<img class="logo logo--dark" src="../../assets/brand/hummi-wordmark-cream.svg" alt="" aria-hidden="true"></a>')
    pl = player_bar(**(player_kw or {})) if player else ""
    cls = ' class="has-player"' if player else ""
    return (f'<div{cls}><div class="sidebar-layout"><nav class="sidebar" aria-label="Primary"><div style="padding:var(--space-2) var(--space-3) var(--space-4)">{logo}</div>{nav}{who}</nav>'
            f'<div>{banner}<header class="topbar">'
            f'<button class="btn btn--ghost btn--icon topbar__menu" type="button" aria-label="Open navigation" aria-expanded="false">{icon("menu")}</button>'
            f'<form class="search" role="search" action="{P("search")}"><label class="visually-hidden" for="q">Search tracks, artists and playlists</label>{icon("search")}'
            f'<input class="input" id="q" type="search" placeholder="Search tracks, artists, playlists" value="{esc(search_value)}"></form>'
            f'<span class="topbar__spacer"></span>{right}</header>'
            f'<main id="main" class="container">{main}</main></div></div>{pl}</div>{extra_after}')


# ---------------------------------------------------------------- file skeleton
def document(kind, sid, state, screen_title, desc, body, states, depth_note=""):
    bar = "".join(
        f'<li><a href="{s}.html"{" aria-current=\"page\"" if s == state else ""}>{s}</a></li>' for s in states)
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(screen_title)} · {esc(state)} — Hummi mocks</title>
<meta name="mock:kind" content="{kind}">
<meta name="mock:screen" content="{sid}">
<meta name="mock:state" content="{state}">
<meta name="description" content="{esc(desc)}">
<link rel="stylesheet" href="../../assets/tokens.css">
<link rel="stylesheet" href="../../assets/ui.css">
<link rel="stylesheet" href="../../assets/mock.css">
</head>
<body>
<a class="skip-link" href="#main">Skip to content</a>
{body}
<nav class="mock-bar" aria-label="Mock navigation">
  <a class="mock-bar__home" href="../../index.html" aria-label="All mocks">⌂</a>
  <span class="mock-bar__screen">{esc(screen_title)}</span>
  <ul class="mock-bar__states">{bar}</ul>
  <button type="button" data-theme-toggle aria-pressed="false">☾ Dark</button>
  <button type="button" data-chrome-toggle aria-label="Hide mock chrome">×</button>
</nav>
<script src="../../assets/mock.js"></script>
</body>
</html>
'''


def dialog_doc(title, desc_text, body_html, footer_html, danger=False, ic="info", title_id="dlg-title", panel_cls="", top_alert=""):
    kind = "danger" if danger else "info"
    return (f'<div class="backdrop"></div><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="{title_id}" aria-describedby="dlg-desc" data-dismiss-on-escape>'
            f'<div class="dialog__panel {panel_cls}"><div class="dialog__header"><div class="dialog__icon dialog__icon--{kind}" aria-hidden="true">{icon(ic)}</div>'
            f'<div style="flex:1"><h2 class="dialog__title" id="{title_id}">{esc(title)}</h2><p id="dlg-desc" class="text-muted" style="margin-top:var(--space-1)">{desc_text}</p></div>'
            f'<button class="btn btn--ghost btn--icon" type="button" aria-label="Close">{icon("close")}</button></div>'
            f'<div class="dialog__body stack">{top_alert}{body_html}</div><div class="dialog__footer">{footer_html}</div></div></div>')

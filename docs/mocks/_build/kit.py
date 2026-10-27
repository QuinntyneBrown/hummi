"""Shared helpers for the Hummi mock generator: cast, icons, shell, state blocks, file skeleton.

Edit the screens_*.py files and run `python docs/mocks/_build/build.py`; never hand-edit the HTML.
"""
from html import escape as esc

PROJECT = "Hummi"
TODAY = "Tue 27 Oct 2026"

# ---------------------------------------------------------------- cast & catalog
USERS = {
    "me": {"name": "Nadia Charles", "initials": "NC", "handle": "nadia"},
    "jonah": {"name": "Jonah Adeyemi", "initials": "JA", "handle": "jonah"},
    "mei": {"name": "Mei Rodríguez", "initials": "MR", "handle": "mei"},
}
CDN = "https://cdn.magicpatterns.com/patterns/generated-images/"
# Cover art ids come from the Magic Patterns "Hummi home screen" design (data/tracks.ts).
ART = {
    "feathers-up": "9b9fc48a-3ebb-4459-991e-afb5a29c3e35",
    "road-march-riddim": "1d827d81-fe98-4fe1-a3b2-b0aab725c8dd",
    "jouvert-morning": "2ccf7ccc-f306-4b30-8bbb-fd5b6289ed11",
    "big-truck-energy": "fe585510-ffc6-478e-81f0-6608a23b6665",
    "sunrise-on-ariapita": "93469f13-cb45-4853-967e-5048ce0bb1b1",
    "wine-slow": "58574127-daa6-4e91-a17d-e563a94583fc",
    "chrome-copper": "f920aaff-78ab-483a-a248-4802cff6140b",
    "mister-kaiso": "35d90c8b-d4da-48e9-b913-3796f30e0813",
    "panyard-nights": "896df414-e435-4a74-b519-c4a5af63cda6",
    "hummi-sings-hello": "131d21b3-bfa9-4bd0-9576-3763d62fb19e",
    "billboard": "04f9bc2c-0fc7-4248-b4db-d0052c79a2fb",
    "panny-the-pan": "6126bcb0-116f-4123-8335-825b39402296",
    "conga-in-the-jungle": "9620f04e-71db-4d7c-9a40-3d49303f196e",
    "fruit-salad-band": "e1d39d41-3fd0-407f-a429-d46d4b2b25eb",
    "sound-system-sunday": "f0319604-bdd5-42cf-bb4a-f39c13616779",
    "red-light-riddim": "24248a6d-cee8-4765-89e1-b91730787283",
    "fisherman-dawn": "05fc0c86-9896-4d6d-94ae-66420bdec091",
    "banana-leaf-rain": "e5921bbd-ca40-418c-8ca8-6300d8d1f0f0",
}


def art(key):
    return CDN + ART[key] + ".jpg"


ARTISTS = [
    {"id": "kaiso-collective", "name": "Kaiso Collective", "genre": "Soca", "model": "openmusic-3b", "listeners": "48,210", "cover": art("feathers-up")},
    {"id": "lady-tamboo", "name": "Lady Tamboo", "genre": "Soca", "model": "openmusic-3b", "listeners": "31,904", "cover": art("road-march-riddim")},
    {"id": "marisol-vega", "name": "Marisol Vega", "genre": "Soca", "model": "synthbloom-1.5", "listeners": "22,576", "cover": art("wine-slow")},
    {"id": "panorama-players", "name": "Panorama Players", "genre": "Steelpan", "model": "swingnet-open", "listeners": "12,038", "cover": art("chrome-copper")},
    {"id": "lord-sundown", "name": "Lord Sundown", "genre": "Calypso", "model": "openmusic-3b", "listeners": "9,481", "cover": art("mister-kaiso")},
    {"id": "laventille-steel", "name": "Laventille Steel Orchestra", "genre": "Steelpan", "model": "swingnet-open", "listeners": "17,322", "cover": art("panyard-nights")},
    {"id": "little-hummi", "name": "Little Hummi", "genre": "Kids", "model": "openmusic-3b", "listeners": "8,904", "cover": art("hummi-sings-hello")},
    {"id": "beach-band-buddies", "name": "Beach Band Buddies", "genre": "Kids", "model": "openmusic-3b", "listeners": "5,311", "cover": art("panny-the-pan")},
    {"id": "iguana-crew", "name": "The Iguana Crew", "genre": "Kids", "model": "openmusic-3b", "listeners": "4,102", "cover": art("conga-in-the-jungle")},
    {"id": "mango-co", "name": "Mango & Co.", "genre": "Kids", "model": "openmusic-3b", "listeners": "3,870", "cover": art("fruit-salad-band")},
    {"id": "yard-frequency", "name": "Yard Frequency", "genre": "Dancehall", "model": "synthbloom-1.5", "listeners": "14,660", "cover": art("sound-system-sunday")},
    {"id": "shanique", "name": "Shanique", "genre": "Dancehall", "model": "synthbloom-1.5", "listeners": "19,215", "cover": art("red-light-riddim")},
    {"id": "quiet-harbour", "name": "Quiet Harbour", "genre": "Island chill", "model": "openmusic-3b", "listeners": "6,540", "cover": art("fisherman-dawn")},
    {"id": "lofi-lagoon", "name": "lofi lagoon", "genre": "Island chill", "model": "openmusic-3b", "listeners": "11,008", "cover": art("banana-leaf-rain")},
]
A = {a["id"]: a for a in ARTISTS}
LICENCES = {"CC0": "CC0 1.0 (public domain)", "CC-BY": "CC BY 4.0", "CC-BY-SA": "CC BY-SA 4.0"}
TRACKS = [
    # id, title, artist, album, genre, duration, licence, plays
    ("feathers-up", "Feathers Up", "kaiso-collective", "Mas on the Avenue", "Soca", "3:42", "CC0", "128,904"),
    ("road-march-riddim", "Road March Riddim", "lady-tamboo", "Road March Riddim", "Soca", "4:05", "CC0", "96,311"),
    ("wine-slow", "Wine Slow", "marisol-vega", "Slow Wine", "Soca", "3:34", "CC-BY", "212,450"),
    ("jouvert-morning", "J’ouvert Morning", "kaiso-collective", "Mas on the Avenue", "Soca", "3:58", "CC0", "174,022"),
    ("big-truck-energy", "Big Truck Energy", "lady-tamboo", "Road March Riddim", "Soca", "3:21", "CC-BY-SA", "88,730"),
    ("sunrise-on-ariapita", "Sunrise on Ariapita", "marisol-vega", "Slow Wine", "Soca", "4:17", "CC-BY-SA", "61,208"),
    ("chrome-copper", "Chrome & Copper", "panorama-players", "Panyard Sessions", "Steelpan", "5:12", "CC-BY", "40,115"),
    ("mister-kaiso", "Mister Kaiso", "lord-sundown", "Old Talk", "Calypso", "3:08", "CC0", "27,640"),
    ("panyard-nights", "Panyard Nights", "laventille-steel", "Panyard Sessions", "Steelpan", "6:40", "CC-BY", "55,903"),
    ("hummi-sings-hello", "Hummi Sings Hello", "little-hummi", "Hummi Sings Hello", "Kids", "2:12", "CC0", "33,018"),
    ("panny-the-pan", "Panny the Pan", "beach-band-buddies", "Beach Songs", "Kids", "2:40", "CC0", "18,442"),
    ("conga-in-the-jungle", "Conga in the Jungle", "iguana-crew", "Jungle Songs", "Kids", "2:55", "CC0", "12,970"),
    ("fruit-salad-band", "Fruit Salad Band", "mango-co", "Fruit Salad", "Kids", "2:26", "CC0", "9,311"),
    ("sound-system-sunday", "Sound System Sunday", "yard-frequency", "Dubplates", "Dancehall", "3:16", "CC-BY", "25,604"),
    ("red-light-riddim", "Red Light Riddim", "shanique", "Red Light", "Dancehall", "3:02", "CC-BY", "47,893"),
    ("fisherman-dawn", "Fisherman Dawn", "quiet-harbour", "Slow Tide", "Island chill", "4:48", "CC-BY-SA", "15,237"),
    ("banana-leaf-rain", "Banana Leaf Rain", "lofi-lagoon", "Lagoon Tapes", "Island chill", "3:12", "CC-BY-SA", "21,775"),
    ("a-very-long-title", "The Quiet Between Two Lighthouses, Revisited (Extended Panyard Mix)", "panorama-players", "Panyard Sessions", "Steelpan", "7:19", "CC-BY", "1,204"),
]
T = {t[0]: dict(zip(["id", "title", "artist", "album", "genre", "dur", "licence", "plays"], t)) for t in TRACKS}
NOW = "feathers-up"
GENRES = [("Soca", "c1"), ("Kids", "c2"), ("Steelpan & Calypso", "c3"), ("Dancehall", "c5"), ("Island chill", "c4"), ("Parang", "c6"),
          ("Chutney", "c1"), ("Reggae", "c4"), ("Zouk", "c3"), ("Rapso", "c2")]
# Browse-by-sound tiles use a representative cover per genre.
SOUND_ART = {"Soca": "feathers-up", "Kids": "hummi-sings-hello", "Steelpan & Calypso": "chrome-copper", "Dancehall": "red-light-riddim",
             "Island chill": "fisherman-dawn", "Parang": "jouvert-morning", "Chutney": "wine-slow", "Reggae": "sound-system-sunday",
             "Zouk": "banana-leaf-rain", "Rapso": "mister-kaiso"}
QUEUE = ["red-light-riddim", "panyard-nights", "big-truck-energy", "fisherman-dawn"]
MORE_SOCA = ["jouvert-morning", "sunrise-on-ariapita", "wine-slow", "road-march-riddim"]
PLAYLISTS = [
    ("late-night-coding", "Road trip to the north coast", "me", 24, art("big-truck-energy")),
    ("rain-on-the-window", "Rainy-day panyard", "me", 18, art("panyard-nights")),
    ("sunday-kitchen", "Sunday kitchen", "mei", 31, art("wine-slow")),
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
    "chev": '<path d="m9 5 7 7-7 7"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', "expand": '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
    "list-plus": '<path d="M4 6h12M4 12h8M4 18h8M17 14v6M14 17h6"/>', "list-end": '<path d="M4 6h16M4 12h16M4 18h8M16 16l3 2-3 2"/>',
    "mic": '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', "disc": '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    "download": '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>', "history": '<path d="M4 12a8 8 0 1 0 3-6.2L4 8M4 4v4h4M12 8v4l3 2"/>',
    "copy": '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>', "code": '<path d="m8 8-5 4 5 4M16 8l5 4-5 4M14 5l-4 14"/>',
    "message": '<path d="M4 5h16v11H9l-5 4z"/>', "upload": '<path d="M12 20V9M7 13l5-5 5 5M5 4h14"/>',
    "arrow-up-right": '<path d="M7 17 17 7M8 7h9v9"/>', "skip": '<path d="M6 5v14M18 5 9 12l9 7z"/>', "cc": '<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5a3 3 0 1 0 0 5"/>',
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


def Dlg(sid, state="default"):
    """Link to a dialog or overlay mock; works from pages/<id>/ and from dialogs/<id>/."""
    return f"{_ctx['pages']}../dialogs/{sid}/{state}.html"


def P(sid, state="default"):
    return f"{_ctx['pages']}{sid}/{state}.html"


# ---------------------------------------------------------------- small blocks
def cover(cls="c1", size="", label=None):
    s = f" cover--{size}" if size else ""
    if cls.startswith("http"):
        return f'<div class="cover cover--c1 cover--art{s}" aria-hidden="true"><img src="{cls}" alt="" loading="lazy">{icon("music")}</div>'
    return f'<div class="cover cover--{cls}{s}" aria-hidden="true">{icon("music")}</div>'


def btn(label, kind="", ic=None, attrs="", href=None, size=""):
    k = " ".join(x for x in ["btn", f"btn--{kind}" if kind else "", f"btn--{size}" if size else ""] if x)
    i = icon(ic) if ic else ""
    if href:
        return f'<a class="{k}" href="{href}"{attrs}>{i}{label}</a>'
    return f'<button class="{k}" type="button"{attrs}>{i}{label}</button>'


def ibtn(label, ic, attrs="", kind="ghost"):
    return f'<button class="btn btn--{kind} btn--icon" type="button" aria-label="{esc(label)}"{attrs}>{icon(ic)}</button>'


def track_row(tid, n, playing=False, extra_actions="", liked=False, select=None):
    """select: None for a plain row, else whether the row's selection checkbox is checked (L2-023)."""
    t = T[tid]
    a = A[t["artist"]]
    cur = ' aria-current="true"' if playing else ""
    num = f'<span class="eq" role="img" aria-label="Playing"><span></span><span></span><span></span></span>' if playing else str(n)
    heart = ibtn(("Remove like from " if liked else "Like ") + t["title"], "heart", f' aria-pressed="{"true" if liked else "false"}"')
    check = "" if select is None else f'<input class="track__check" type="checkbox" aria-label="Select {esc(t["title"])}"{" checked" if select else ""}>'
    cls = "track" + ("" if select is None else " track--selectable") + (" track--selected" if select else "")
    return (f'<li class="{cls}"{cur}>{check}<span class="track__num">{num}</span>{cover(a["cover"], "sm")}'
            f'<div style="min-width:0"><div class="track__title"><a href="{P("track")}" style="color:inherit;text-decoration:none">{esc(t["title"])}</a></div>'
            f'<div class="track__meta">{esc(a["name"])} · {t["dur"]}</div></div>'
            f'<div class="track__actions">{heart}{extra_actions}{ibtn("More actions for " + t["title"], "more")}</div></li>')


def track_list(tids, playing=None, label="Tracks", liked=(), selected=None):
    rows = "".join(track_row(t, i + 1, t == playing, liked=t in liked, select=None if selected is None else i in selected) for i, t in enumerate(tids))
    return f'<ol class="track-list" aria-label="{esc(label)}">{rows}</ol>'


def tile(tid_or_pl, kind="track", new=False, playing=False):
    """A shelf card: artwork, hover play button, more-actions button, title and meta."""
    cur = ' aria-current="true"' if playing else ""
    badge = '<span class="card-track__new">New</span>' if new and not playing else ""
    play = f'<span class="card-track__play">{icon("pause" if playing else "play", fill=True)}</span>'
    if kind == "track":
        t = T[tid_or_pl]; a = A[t["artist"]]
        eq = '<span class="eq eq--live" role="img" aria-label="Playing"><span></span><span></span><span></span></span>' if playing else ""
        more = f'<a class="card-track__more" href="{Dlg("track-menu")}" aria-haspopup="menu" aria-label="More actions for {esc(t["title"])}">{icon("more")}</a>'
        return (f'<div class="card-track"{cur}><div class="card-track__art"><a class="card-track__cover" href="{P("track")}" aria-label="{esc(t["title"])}, {esc(a["name"])}">{cover(a["cover"])}</a>{badge}{play}{more}</div>'
                f'<a class="card-track__title" href="{P("track")}">{eq}<span>{esc(t["title"])}</span></a>'
                f'<span class="card-track__meta">{esc(a["name"])} · {t["dur"]}</span></div>')
    if kind == "artist":
        a = A[tid_or_pl]
        return (f'<div class="card-track card-track--round"><div class="card-track__art"><a class="card-track__cover" href="{P("artist")}" aria-label="{esc(a["name"])}">{cover(a["cover"])}</a></div>'
                f'<a class="card-track__title" href="{P("artist")}"><span>{esc(a["name"])}</span></a><span class="card-track__meta">{a["listeners"]} monthly listeners</span></div>')
    pid, name, owner, n, cv = tid_or_pl
    return (f'<div class="card-track"><div class="card-track__art"><a class="card-track__cover" href="{P("playlist")}" aria-label="{esc(name)}">{cover(cv)}</a>{play}</div>'
            f'<a class="card-track__title" href="{P("playlist")}"><span>{esc(name)}</span></a><span class="card-track__meta">{n} tracks · {esc(USERS[owner]["name"])}</span></div>')


def top_ten(tids):
    out = ""
    for i, t in enumerate(tids, 1):
        wide = " top10__num--wide" if i == 10 else ""
        out += f'<div class="top10"><span class="top10__num{wide}" aria-hidden="true">{i}</span>{tile(t)}</div>'
    return out


def billboard(kicker, title, artist, blurb, meta, image, lead, actions):
    t = T[lead]; a = A[t["artist"]]
    return (f'<section class="billboard" aria-label="Featured"><div class="billboard__text">'
            f'<p class="billboard__kicker">{esc(kicker)}</p><h1 class="billboard__title">{esc(title)}</h1>'
            f'<p class="billboard__artist">{esc(artist)}</p><p class="billboard__blurb">{esc(blurb)}</p><p class="billboard__meta">{esc(meta)}</p>'
            f'<div class="billboard__actions">{actions}</div></div>'
            f'<div class="billboard__media"><img src="{image}" alt="" loading="lazy">'
            f'<div class="billboard__chip"><img src="{a["cover"]}" alt="" loading="lazy"><div><small>Opens with</small><strong>{esc(t["title"])}</strong></div></div></div></section>')


def shelf(title, inner, more=None, note="", rail=False):
    """A titled section. rail=True lays cards out as a horizontal scrolling carousel."""
    link = f'<a class="shelf__more" href="{more}">See all</a>' if more else ""
    nt = f'<span class="shelf__note">{esc(note)}</span>' if note else ""
    hid = "sh-" + "".join(c for c in title.lower() if c.isalnum())
    if rail:
        nxt = icon("back").replace("<svg ", '<svg style="rotate:180deg" ', 1)
        arrows = (f'<button class="shelf__arrow shelf__arrow--prev" type="button" aria-label="Previous">{icon("back")}</button>'
                  f'<button class="shelf__arrow shelf__arrow--next" type="button" aria-label="Next">{nxt}</button>')
        inner = f'<div class="shelf__rail">{arrows}<div class="shelf__track" tabindex="0" role="group" aria-label="{esc(title)}">{inner}</div></div>'
    return f'<section class="shelf" aria-labelledby="{hid}"><div class="shelf__head"><h2 class="shelf__title" id="{hid}">{esc(title)}</h2>{nt}{link}</div>{inner}</section>'


def skel_tiles(n=6):
    one = '<div class="card-track" aria-hidden="true"><div class="skeleton skeleton--rect" style="aspect-ratio:1;border-radius:0.875rem"></div><div class="skeleton skeleton--text" style="margin-top:0.625rem"></div><div class="skeleton skeleton--text"></div></div>'
    return f'<div class="shelf__track" aria-busy="true" aria-label="Loading">{one * n}</div>'


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
    e = f'<span class="field__error" id="{name}-err">{error}</span>' if error else ""
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
NAV = [("home", "Home"), ("genre", "Soca"), ("genre", "Kids"), ("genre", "Steelpan"), ("library", "Your library")]
KIDS_HIDDEN = ("Soca", "Steelpan")


def scrubber(elapsed="1:14", total="3:42", pct=33, full=False):
    cls = "scrubber scrubber--full" if full else "scrubber"
    return (f'<div class="{cls}"><time>{elapsed}</time><div class="scrubber__track" role="progressbar" aria-label="Track position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="{pct}">'
            f'<div class="scrubber__fill" style="width:{pct}%"></div><div class="scrubber__thumb" style="left:{pct}%"></div></div><time>{total}</time></div>')


def sbtn(label, ic, attrs="", cls="ibtn", href=None, fill=False):
    if href:
        return f'<a class="{cls}" href="{href}" aria-label="{esc(label)}"{attrs}>{icon(ic, fill=fill)}</a>'
    return f'<button class="{cls}" type="button" aria-label="{esc(label)}"{attrs}>{icon(ic, fill=fill)}</button>'


def player_bar(tid=NOW, playing=True, disabled=False, error=False, saved=False):
    t = T[tid]; a = A[t["artist"]]
    dis = " disabled" if disabled else ""
    eq = '<span class="eq eq--live" role="img" aria-label="Playing"><span></span><span></span><span></span></span>' if playing and not error else ""
    sub = f'<span class="pbar__artist" style="color:var(--color-danger-fg)">Playback stopped. Check your connection.</span>' if error else f'<span class="pbar__artist">{esc(a["name"])}</span>'
    heart = sbtn(("Remove " if saved else "Save ") + t["title"] + (" from your library" if saved else " to your library"), "heart", f' aria-pressed="{"true" if saved else "false"}"')
    return (f'<section class="pbar" aria-label="Player">'
            f'<div class="pbar__now"><a class="pbar__art" href="{P("now-playing")}" aria-label="Open Now playing">{cover(a["cover"])}</a>'
            f'<div class="pbar__text"><a class="pbar__title" href="{P("track")}">{eq}<span>{esc(t["title"])}</span></a>{sub}</div>'
            f'{heart}{sbtn("More actions for " + t["title"], "more", " aria-haspopup=\"menu\"", href=Dlg("track-menu", "from-player"))}</div>'
            f'<div class="pbar__centre"><div class="pbar__ctrl">{sbtn("Previous track", "skip", dis, fill=True)}'
            f'{sbtn("Pause" if playing else "Play", "pause" if playing else "play", dis, cls="ibtn ibtn--play", fill=True)}'
            f'{sbtn("Next track", "skip", dis + " style=\"rotate:180deg\"", fill=True)}</div>{scrubber("1:14", t["dur"], 33)}</div>'
            f'<div class="pbar__side">{sbtn("Share", "share", href=Dlg("share"))}{sbtn("Queue", "queue", href=P("queue"))}'
            f'<div class="volume">{icon("volume")}<div class="volume__track"><i></i></div></div>{sbtn("Expand", "expand", href=P("now-playing"))}</div></section>')


def shell(active, main, player=True, player_kw=None, banner="", search_value="", signed_in=True, extra_after="", kids=False, solid=None, menu_open=False):
    links = ""
    for sid, label in NAV:
        if kids and label in KIDS_HIDDEN:
            continue
        cur = ' aria-current="page"' if (sid == active and label in ("Home", "Your library")) else ""
        links += f'<a class="topnav__link" href="{P(sid)}"{cur}>{label}</a>'
    pill = (f'<a class="search-pill" href="{P("search")}" aria-label="Search songs and artists">{icon("search")}<span>Search songs and artists</span><kbd aria-hidden="true">/</kbd></a>'
            f'<a class="ibtn search-icon" href="{P("search")}" aria-label="Search songs and artists">{icon("search")}</a>')
    if signed_in:
        exp = "true" if menu_open else "false"
        right = (f'{pill}<a class="ibtn" href="{P("notifications")}" aria-label="Notifications, 3 unread">{icon("bell")}</a>'
                 f'<a class="avatar avatar--nav" href="{Dlg("account-menu")}" aria-haspopup="menu" aria-expanded="{exp}" aria-label="Account: {USERS["me"]["name"]}">{USERS["me"]["initials"][0]}</a>')
    else:
        right = pill + btn("Sign in", href=P("sign-in")) + btn("Sign up", "primary", href=P("sign-up"))
    logo = (f'<a class="topnav__brand" href="{P("home")}" aria-label="Hummi home">'
            f'<img class="brand-logo brand-logo--light" src="../../assets/brand/hummi-wordmark-coral.svg" alt="Hummi">'
            f'<img class="brand-logo brand-logo--dark" src="../../assets/brand/hummi-wordmark-cream.svg" alt="" aria-hidden="true"></a>')
    solid = (active != "home") if solid is None else solid
    pl = player_bar(**(player_kw or {})) if player else ""
    cls = ' class="has-player"' if player else ""
    foot = ('<footer class="site-footer"><span>Every track on Hummi is free to stream and free to share.</span>'
            '<span>hummi.fm — free music, made in the open.</span></footer>')
    return (f'<div{cls}>{banner}<header class="topnav{" topnav--solid" if solid else ""}"><button class="ibtn topnav__menu" type="button" data-nav-toggle aria-label="Open navigation" aria-expanded="false">{icon("menu")}</button>'
            f'{logo}<nav class="topnav__links" aria-label="Primary">{links}</nav><div class="topnav__end">{right}</div></header>'
            f'<main id="main" class="container app-main">{main}{foot}</main>{pl}</div>{extra_after}')


# ---------------------------------------------------------------- overlays
def srow_song(tid, playing=False):
    t = T[tid]; a = A[t["artist"]]
    eq = '<span class="eq eq--live" role="img" aria-label="Playing"><span></span><span></span><span></span></span>' if playing else ""
    cur = ' aria-current="true"' if playing else ""
    return (f'<div class="srow"{cur}>{cover(a["cover"], "sm")}<div class="srow__text"><a class="srow__title" href="{P("track")}" style="color:inherit;text-decoration:none">{eq}<span>{esc(t["title"])}</span></a>'
            f'<div class="srow__sub">{esc(a["name"])}</div></div><span class="srow__dur">{t["dur"]}</span>'
            f'{sbtn("More actions for " + t["title"], "more", " aria-haspopup=\"menu\"", href=Dlg("track-menu"))}</div>')


def search_overlay(state):
    q = {"default": "pan", "loading": "pan", "error": "pan", "no-results": "rainfall in b-flat", "empty": ""}[state]
    clear = '<button class="layer-search__clear" type="button">Clear</button>' if q else ""
    bar = (f'<div class="layer-search__bar">{icon("search")}<input class="layer-search__input" id="q" type="search" placeholder="Search songs and artists" aria-label="Search songs and artists" value="{esc(q)}">'
           f'{clear}<a class="layer-search__close" href="{P("home")}" aria-label="Close search">{icon("close")}</a></div>')
    if state == "empty":
        recent = "".join(f'<li><a href="{P("search")}">{icon("clock")}{esc(r)}</a></li>' for r in ["Kaiso Collective", "panorama", "lullaby", "Shanique"])
        sounds = "".join(f'<a class="sound" href="{P("genre")}">{cover(art(SOUND_ART[g]))}<span class="sound__cap"><strong>{esc(g)}</strong><small>{n} tracks</small></span></a>'
                         for (g, _), n in zip(GENRES[:5], [1204, 312, 188, 240, 156]))
        body = (f'<div class="layer-search__body layer-search__body--empty"><section><h2 class="layer-h">Recent</h2><ul class="recent">{recent}</ul></section>'
                f'<section><h2 class="layer-h">Browse by sound</h2><div class="sound-grid">{sounds}</div></section></div>')
    elif state == "loading":
        body = '<div class="layer-search__body" aria-busy="true">' + skel_rows(5) + "</div>"
    elif state == "no-results":
        body = (f'<div class="layer-empty"><strong>Nothing matches “{esc(q)}”</strong><p>Try an artist name, or a sound like soca, pan or lullaby.</p></div>')
    elif state == "error":
        body = '<div class="layer-search__body">' + error_block("Search isn’t working right now", "We couldn’t reach search. Your query is still in the box; try again in a moment.", retry_href="default.html") + "</div>"
    else:
        top = T["panyard-nights"]; ta = A[top["artist"]]
        arts = "".join(f'<a class="srow srow--artist" href="{P("artist")}" style="color:inherit;text-decoration:none">{cover(A[x]["cover"], "sm")}<div class="srow__text"><div class="srow__title"><span>{esc(A[x]["name"])}</span></div></div>{icon("arrow-up-right")}</a>' for x in ["laventille-steel", "panorama-players"])
        songs = "".join(srow_song(x, x == NOW) for x in ["panyard-nights", "chrome-copper", "a-very-long-title", "mister-kaiso"])
        body = (f'<div class="layer-search__body layer-search__body--results"><section><h2 class="layer-h">Top result</h2>'
                f'<a class="top-result" href="{P("track")}">{cover(ta["cover"])}<strong>{esc(top["title"])}</strong><span>{esc(ta["name"])} · {top["dur"]}</span></a></section>'
                f'<div><section><h2 class="layer-h">Artists</h2>{arts}</section><section style="margin-top:var(--space-6)"><h2 class="layer-h">Songs</h2>{songs}</section></div></div>')
    return f'<div class="scrim"></div><div class="layer-search" role="dialog" aria-modal="true" aria-label="Search" data-dismiss-on-escape>{bar}{body}</div>'


def now_playing_overlay(state):
    t = T[NOW]; a = A[t["artist"]]
    playing = state != "paused"
    top = (f'<div class="layer-player__top"><a class="pill-btn" href="{P("home")}">{icon("chev").replace("<svg ", "<svg style=\"rotate:90deg\" ", 1)}Close</a>'
           f'<span class="layer-player__from">Playing from <b>{t["genre"]}</b></span><span style="width:5.75rem"></span></div>')
    ctrl = (f'<div class="layer-player__ctrl">{sbtn("Shuffle", "shuffle", " aria-pressed=\"false\"", cls="ibtn ibtn--lg")}<div class="mid">'
            f'{sbtn("Previous track", "skip", cls="ibtn ibtn--lg", fill=True)}{sbtn("Pause" if playing else "Play", "pause" if playing else "play", cls="ibtn ibtn--hero", fill=True)}'
            f'{sbtn("Next track", "skip", " style=\"rotate:180deg\"", cls="ibtn ibtn--lg", fill=True)}</div>{sbtn("Repeat", "repeat", " aria-pressed=\"false\"", cls="ibtn ibtn--lg")}</div>')
    acts = (f'<div class="layer-player__acts"><button class="pill-btn pill-btn--lg" type="button">{icon("heart")}Save</button>'
            f'<a class="pill-btn pill-btn--lg" href="{Dlg("share")}">{icon("share")}Share</a><a class="pill-btn pill-btn--lg" href="{P("queue")}">{icon("queue")}Queue</a>'
            f'<a class="ibtn ibtn--lg" style="background:color-mix(in srgb,var(--color-fg-default) 8%,transparent)" href="{Dlg("track-menu", "from-player")}" aria-haspopup="menu" aria-label="More actions for {esc(t["title"])}">{icon("more")}</a></div>')
    nxt = "".join(f'<div class="srow">{cover(A[T[x]["artist"]]["cover"], "sm")}<div class="srow__text"><div class="srow__title"><span>{esc(T[x]["title"])}</span></div><div class="srow__sub">{esc(A[T[x]["artist"]]["name"])}</div></div><span class="srow__dur">{T[x]["dur"]}</span></div>' for x in QUEUE[:2])
    body = (f'<div class="layer-player__body"><div class="layer-player__art">{cover(a["cover"])}</div><div><h2 class="layer-player__title">{esc(t["title"])}</h2>'
            f'<p class="layer-player__artist">{esc(a["name"])}</p><div class="layer-player__scrub">{scrubber("1:14", t["dur"], 33, full=True)}</div>{ctrl}{acts}'
            f'<div class="upnext"><h3 class="layer-h">Up next</h3>{nxt}</div></div></div>')
    if state == "loading":
        body = '<div class="layer-player__body" aria-busy="true"><div class="skeleton skeleton--rect layer-player__art" style="aspect-ratio:1"></div><div><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div></div></div>'
    elif state == "empty":
        body = '<div class="layer-player__body">' + empty("music", "Nothing is playing", "Press play on any track and it shows up here with the waveform and queue.", btn("Browse genres", "primary", href=P("browse"))) + "</div>"
    elif state == "error":
        body = '<div class="layer-player__body" style="padding-block:0">' + alert("danger", "Playback stopped", "We lost the connection while streaming Feathers Up. We’ll resume from 1:14 once you’re back online.") + "</div>" + body
    return f'<div class="layer-player" role="dialog" aria-modal="true" aria-label="Now playing" data-dismiss-on-escape>{top}{body}</div>'


def queue_drawer(state):
    t = T[NOW]; a = A[t["artist"]]
    now = (f'<div class="q-row q-row--now">{cover(a["cover"], "sm")}<div class="srow__text"><div class="srow__title">'
           f'<span class="eq eq--live" role="img" aria-label="Playing"><span></span><span></span><span></span></span><span>{esc(t["title"])}</span></div><div class="srow__sub">{esc(a["name"])}</div></div></div>')

    def row(x, more=False):
        tt = T[x]; aa = A[tt["artist"]]
        end = f'<span class="srow__dur">{tt["dur"]}</span>' if more else sbtn("Remove " + tt["title"] + " from the queue", "close")
        return (f'<div class="q-row{" q-row--more" if more else ""}">{cover(aa["cover"], "sm")}<div class="srow__text"><div class="srow__title"><span>{esc(tt["title"])}</span></div>'
                f'<div class="srow__sub">{esc(aa["name"])}</div></div>{end}</div>')
    if state == "empty":
        nxt = '<p class="q-empty">Use Play next or Add to queue on any track to line it up here.</p>'
        head_n = 0
    elif state == "loading":
        nxt = skel_rows(3); head_n = 0
    elif state == "error":
        nxt = error_block("Your queue didn’t load", "The server didn’t answer in time. Try again in a moment.", retry_href="default.html"); head_n = 0
    else:
        nxt = "".join(row(x) for x in QUEUE); head_n = len(QUEUE)
    more = "".join(row(x, True) for x in MORE_SOCA) if state in ("default", "empty") else ""
    clear = '<button type="button">Clear</button>' if head_n else ""
    return (f'<aside class="drawer-queue" aria-label="Queue" data-dismiss-on-escape><div class="drawer-queue__head"><h2>Queue</h2>{sbtn("Close queue", "close", href=P("home"))}</div>'
            f'<div class="drawer-queue__body"><div class="q-label"><span>Now playing</span></div>{now}<div class="q-label"><span>Up next{" · " + str(head_n) if head_n else ""}</span>{clear}</div>{nxt}'
            f'{"<div class=q-label><span>Then, more Soca</span></div>" + more if more else ""}</div></aside>')


def account_menu(kids=False):
    u = USERS["me"]
    chk = " checked" if kids else ""
    items = [("library", "Your library", P("library")), ("history", "Listening history", P("library")), ("download", "Downloads", P("library")),
             ("upload", "Share your own music", P("library")), ("settings", "Settings", P("settings"))]
    li = "".join(f'<a class="mi" role="menuitem" href="{h}">{icon(i)}{l}</a>' for i, l, h in items)
    return (f'<div class="menu-scrim"></div><div class="menu-panel menu-panel--account" role="menu" aria-label="Account" data-dismiss-on-escape>'
            f'<div class="menu-id"><span class="avatar">{u["initials"][0]}</span><div><strong>{u["name"]}</strong><small>nadia@hummi.fm</small></div></div>'
            f'<label class="kids-card"><span><strong>Kids mode</strong><small>Only show music made for kids</small></span><input class="tgl" type="checkbox" role="switch" aria-label="Kids mode"{chk}></label>'
            f'{li}<hr class="menu-divider"><a class="mi" role="menuitem" href="{Dlg("sign-out")}">{icon("logout")}Sign out</a></div>')


def track_menu(tid=NOW, saved=False, pos="top:21rem;left:10rem"):
    t = T[tid]; a = A[t["artist"]]
    save = (f'<button class="mi" role="menuitem" type="button" aria-pressed="true">{icon("heart")}Remove from library</button>' if saved
            else f'<button class="mi" role="menuitem" type="button">{icon("heart")}Save to library</button>')
    return (f'<div class="menu-scrim"></div><div class="menu-panel menu-panel--track" role="menu" aria-label="Track actions" style="{pos}" data-dismiss-on-escape>'
            f'<div class="menu-head">{cover(a["cover"], "sm")}<div style="min-width:0"><strong>{esc(t["title"])}</strong><small>{esc(a["name"])} · {t["dur"]}</small></div></div>'
            f'<button class="mi" role="menuitem" type="button">{icon("list-plus")}Play next</button><button class="mi" role="menuitem" type="button">{icon("list-end")}Add to queue</button>{save}'
            f'<a class="mi" role="menuitem" href="{Dlg("share")}">{icon("share")}Share</a><hr class="menu-divider">'
            f'<a class="mi" role="menuitem" href="{P("search")}">{icon("mic")}More from {esc(a["name"])}</a><a class="mi" role="menuitem" href="{P("genre")}">{icon("disc")}Go to {esc(t["genre"])}</a></div>')


def toast_pill(msg, art_tid=None, undo=False):
    lead = cover(A[T[art_tid]["artist"]]["cover"], "sm") if art_tid else '<span class="toast__dot" aria-hidden="true"></span>'
    u = '<button class="toast__undo" type="button">Undo</button>' if undo else ""
    return f'<div class="toast{" toast--undo" if undo else ""}">{lead}<span class="toast__msg">{msg}</span>{u}</div>'


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
<link rel="stylesheet" href="../../../design-system/tokens/tokens.css">
<link rel="stylesheet" href="../../../design-system/assets/components.css">
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

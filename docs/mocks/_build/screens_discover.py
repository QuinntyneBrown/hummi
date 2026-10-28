"""Discovery and playback pages: home, browse, genre, search, track, artist, album, playlist, library, now-playing, queue, shared-track."""
from kit import *

D = lambda sid, st="default": f"../../dialogs/{sid}/{st}.html"
OFFLINE_BANNER = ('<div class="alert alert--warning banner" role="status">' + icon("offline") +
                  '<div class="alert__body"><span><strong>You are offline.</strong> Showing what was saved on this device. Playing tracks you have not heard recently needs a connection.</span></div></div>')


def frame(state, active, title, sub, content, actions="", player=True, banner="", pkw=None, signed_in=True, search=""):
    main = page_header(title, sub, actions) + content.get(state, content["default"])
    return shell(active, main, player=player, banner=banner, player_kw=pkw, signed_in=signed_in, search_value=search)


def err(title="We couldn’t load this page", text="The server didn’t answer in time. Your music hasn’t gone anywhere; try again in a moment."):
    return error_block(title, text, extra=btn("Go to Home", href=P("home")))


GENRE_PILLS = '<div class="pill-row" role="list" aria-label="Genres">' + "".join(
    f'<a class="chip" role="listitem" href="{P("genre")}">{g}</a>' for g, _ in GENRES[:7]) + "</div>"


def home(state, extra="", inert=False, pkw=None, kids=False):
    def rail(title, tids, note="", more=True, new=(), playing=None):
        cards = "".join(tile(t, new=t in new, playing=t == playing) for t in tids)
        return shelf(title, cards, more=P("browse") if more else None, note=note, rail=True)

    bb = billboard("New album · Carnival 2025", "Mas on the Avenue", "Kaiso Collective",
                   "Twelve road-ready tracks recorded live on the Avenue — brass, iron and a whole band of feathers.",
                   "12 tracks · 46 min · Free to stream and share", art("billboard"), "feathers-up",
                   btn("Play album", "primary", "play", href=P("now-playing"), size="lg") + btn("Add to library", "soft", "plus", size="lg"))
    recent = rail("Recently added", ["feathers-up", "big-truck-energy", "panyard-nights", "hummi-sings-hello", "red-light-riddim", "fisherman-dawn"], "Fresh this week")
    top = shelf("Top 10 on Hummi this week", track_list(["big-truck-energy", "red-light-riddim", "feathers-up", "fruit-salad-band", "panyard-nights",
                                                          "road-march-riddim", "fisherman-dawn", "sound-system-sunday", "hummi-sings-hello", "a-very-long-title"],
                                                         playing="feathers-up", label="Top 10 on Hummi this week"),
                more=P("browse"), note="Most played across the islands")
    soca = rail("Soca", ["feathers-up", "road-march-riddim", "jouvert-morning", "big-truck-energy", "sunrise-on-ariapita", "wine-slow"], "Road march contenders", new=("feathers-up", "big-truck-energy"), playing="feathers-up")
    kid = rail("Kids", ["hummi-sings-hello", "panny-the-pan", "conga-in-the-jungle", "fruit-salad-band"], "Sing-alongs and bedtime songs", new=("hummi-sings-hello", "fruit-salad-band"))
    pan = rail("Steelpan & Calypso", ["chrome-copper", "mister-kaiso", "panyard-nights", "a-very-long-title"], new=("panyard-nights",))
    dance = rail("Dancehall", ["sound-system-sunday", "red-light-riddim"], new=("red-light-riddim",))
    chill = rail("Island chill", ["fisherman-dawn", "banana-leaf-rain"], "For slow afternoons", new=("fisherman-dawn",))
    first = shelf("Start with a genre", '<div class="tile-grid">' + "".join(f'<a class="genre-tile cover--{c}" href="{P("genre")}">{g}</a>' for g, c in GENRES[:6]) + "</div>")
    partial = shelf("Soca", err("Soca didn’t load", "Everything else on this page still works. Try the shelf again."), note="Road march contenders")
    skel_bb = ('<section class="billboard" aria-busy="true" aria-label="Loading featured album"><div class="billboard__text"><div class="skeleton skeleton--text" style="width:30%"></div>'
               '<div class="skeleton skeleton--title" style="height:3.5rem;width:80%"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>'
               '<div class="skeleton billboard__media"></div></section>')
    kids_main = ('<section class="kids-banner" aria-label="Kids mode"><div><strong>Kids mode is on</strong><p>Only sing-alongs, lullabies and songs made for little ears.</p></div>'
                 f'<button class="pill-btn pill-btn--lg" type="button">Turn off</button></section><div class="card-grid">'
                 + "".join(tile(t, new=t in ("hummi-sings-hello", "fruit-salad-band")) for t in ["hummi-sings-hello", "panny-the-pan", "conga-in-the-jungle", "fruit-salad-band"]) + "</div>")
    c = {
        "default": bb + recent + top + soca + kid + pan + dance + chill,
        "loading": skel_bb + shelf("Recently added", skel_tiles(6)) + shelf("Top 10 on Hummi this week", skel_rows(6)),
        "empty": empty("music", "Your Home fills up as you listen", "Play a few tracks and we’ll line up what to hear next. Pick a genre to begin.", btn("Browse genres", "primary", href=P("browse"))) + first,
        "no-music": empty("music", "No music yet", "Hummi’s catalogue is empty. Tracks appear here once they are imported from Pixabay Music.", btn("Browse genres", "primary", href=P("browse"))),
        "error": err(),
        "offline": bb + recent + soca,
        "partial": bb + recent + partial + kid,
        "kids": kids_main,
    }
    main = c[state]
    if "<h1" not in main:
        main = '<h1 class="visually-hidden">Home</h1>' + main
    html = shell("home", main, banner=OFFLINE_BANNER if state == "offline" else "", player_kw=pkw or {"tid": "feathers-up"}, kids=(state == "kids"))
    if inert:
        html = f'<div inert aria-hidden="true">{html}</div>'
    return html + extra


def browse(state):
    g = '<div class="tile-grid">' + "".join(f'<a class="genre-tile cover--{c}" href="{P("genre")}">{n}</a>' for n, c in GENRES) + "</div>"
    mood = shelf("Moods", GENRE_PILLS)
    c = {"default": mood + shelf("All genres", g),
         "loading": skel_tiles(6) + skel_tiles(6), "error": err("Genres didn’t load")}
    return frame(state, "browse", "Browse", "10 genres · 4,812 freely licensed tracks", c)


def genre(state):
    tl = ["road-march-riddim", "feathers-up", "panyard-nights", "sunrise-on-ariapita", "mister-kaiso", "jouvert-morning"]
    c = {"default": f'<div class="cluster" style="margin-bottom:var(--space-4)">{btn("Play all", "primary", "play")}{btn("Shuffle", "", "shuffle")}<button class="chip" type="button" aria-pressed="true">Newest</button><button class="chip" type="button" aria-pressed="false">Most played</button></div>' + track_list(tl, label="Soca tracks"),
         "loading": skel_rows(8), "error": err("This genre didn’t load"),
         "empty": empty("music", "No Soca tracks yet", "New tracks arrive every day. Try a neighbouring genre while you wait.", btn("Browse genres", "primary", href=P("browse")))}
    return frame(state, "browse", "Soca", "1,204 tracks · road-march riddims, J’ouvert mornings and fete anthems", c)


def search(state):
    return home("default", extra=search_overlay(state), inert=True)


def wave(played=0.33, n=64):
    import math
    bars = "".join(f'<span class="{"is-played" if i < n * played else ""}" style="height:{25 + int(70 * abs(math.sin(i * 0.7) * math.cos(i * 0.21)))}%"></span>' for i in range(n))
    return f'<div class="wave" role="img" aria-label="Waveform, 33% played">{bars}</div>'


def track(state):
    t = T[NOW]; a = A[t["artist"]]
    acts = btn("Play", "primary", "play", href=P("now-playing")) + ibtn("Like Feathers Up", "heart", ' aria-pressed="false"') + btn("Add to playlist", "", "plus", href=D("add-to-playlist")) + btn("Share", "", "share", href=D("share")) + ibtn("Report this track", "flag")
    dl = (f'<dl class="dl"><dt>Artist</dt><dd><a href="{P("artist")}">{a["name"]}</a></dd><dt>Album</dt><dd><a href="{P("album")}">{t["album"]}</a></dd><dt>Genre</dt><dd>{t["genre"]}</dd>'
          f'<dt>Source</dt><dd><a href="https://pixabay.com/music/" target="_blank" rel="noopener noreferrer">Pixabay</a></dd><dt>Licence</dt><dd><a href="{P("licence")}">{LICENCES["PIXABAY"]}</a></dd><dt>Plays</dt><dd>{t["plays"]}</dd></dl>')
    default = (f'<section class="hero" aria-label="Track">{cover(a["cover"])}<div class="stack"><span class="overline">Track · {t["dur"]}</span>'
               f'<div class="cluster">{acts}</div>{wave()}</div></section><section class="section"><h2 style="font:var(--text-h3);margin-bottom:var(--space-3)">Details</h2>{dl}</section>'
               + shelf("More from Kaiso Collective", track_list(["jouvert-morning"], label="More from Kaiso Collective")))
    sk = '<div class="skeleton skeleton--rect" style="height:14rem"></div>' + skel_rows(3)
    gone = alert("warning", "This track is no longer available", "Its creator withdrew it, so we can’t play it. It was licensed {0}; copies already shared keep that licence.".format(LICENCES["PIXABAY"])) + shelf("Similar tracks", track_list(["road-march-riddim", "panyard-nights"], label="Similar tracks"))
    c = {"default": default, "loading": sk, "error": err("This track didn’t load"), "unavailable": gone}
    return frame(state, "browse", "Feathers Up", f'<a href="{P("artist")}">Kaiso Collective</a> · Mas on the Avenue', c)


def artist(state):
    a = A["kaiso-collective"]
    default = (f'<section class="hero">{cover(a["cover"]).replace("cover ", "cover round ", 1)}<div class="stack"><span class="overline">Artist</span>'
               f'<div class="cluster">{btn("Play", "primary", "play")}{btn("Follow", "", "plus", " aria-pressed=\"false\"")}{btn("Share", "", "share", href=D("share"))}</div></div></section>'
               + shelf("Popular", track_list(["feathers-up", "jouvert-morning"], playing="feathers-up", label="Popular tracks"))
               + shelf("Releases", f'<div class="card-grid"><a class="card-track" href="{P("album")}"><span class="card-track__art">{cover(a["cover"])}</span><span class="card-track__title"><span>Mas on the Avenue</span></span><span class="card-track__meta">2026 · 2 tracks</span></a></div>'))
    c = {"default": default, "loading": '<div class="skeleton skeleton--rect" style="height:12rem"></div>' + skel_rows(4), "error": err("This artist didn’t load"),
         "empty": empty("music", "No tracks released yet", "Kaiso Collective hasn’t published anything. Follow to hear when they do.", btn("Follow", "primary", "plus"))}
    return frame(state, "browse", "Kaiso Collective", "48,210 monthly listeners", c)


def album(state):
    c = {"default": f'<div class="cluster" style="margin-bottom:var(--space-4)">{btn("Play", "primary", "play")}{btn("Add to playlist", "", "plus", href=D("add-to-playlist"))}{btn("Share", "", "share", href=D("share"))}</div>' + track_list(["feathers-up", "jouvert-morning"], playing="feathers-up", label="Mas on the Avenue tracks") + '<p class="text-caption" style="margin-top:var(--space-4)">2026 · 2 tracks · 8 min · CC0 1.0 (public domain)</p>',
         "loading": skel_rows(4), "error": err("This album didn’t load")}
    return frame(state, "browse", "Mas on the Avenue", f'<a href="{P("artist")}">Kaiso Collective</a> · Album', c)


def playlist(state):
    ids = ["wine-slow", "jouvert-morning", "feathers-up", "panyard-nights", "big-truck-energy"]
    own = f'{btn("Play", "primary", "play")}{btn("Share", "", "share", href=D("share"))}{btn("Rename", "", "settings", href=D("create-playlist", "rename"))}{btn("Delete", "", "trash", href=D("delete-playlist"))}'
    other = f'{btn("Play", "primary", "play")}{btn("Save to my library", "", "plus")}{btn("Share", "", "share", href=D("share"))}'
    sel = ('<div class="alert alert--info" role="status">' + icon("info") + '<div class="alert__body"><div class="alert__title">2 tracks selected</div></div>'
           + btn("Remove from playlist", "", "trash") + btn("Add to another playlist", "", "plus", href=D("add-to-playlist")) + '</div>')
    c = {"default": track_list(ids, playing="feathers-up", label="Road trip to the north coast", liked=("jouvert-morning",), selected=()),
         "loading": skel_rows(6), "error": err("This playlist didn’t load"),
         "empty": empty("music", "Nothing here yet", "Add tracks from anywhere with Add to playlist, or start from a genre.", btn("Browse genres", "primary", href=P("browse"))),
         "selected": sel + track_list(ids, label="Road trip to the north coast", selected=(0, 2)),
         "read-only": alert("info", "This playlist belongs to Mei Rodríguez", "You can listen and save a copy to your library. Only Mei can change the tracks.") + track_list(ids[:3], label="Sunday kitchen")}
    if state == "read-only":
        return frame(state, "library", "Sunday kitchen", "31 tracks · by Mei Rodríguez · public", c, other)
    return frame(state, "library", "Road trip to the north coast", "24 tracks · 1 h 32 min · private", c, own if state != "empty" else btn("Share", "", "share", href=D("share")))


def library(state):
    default = (f'<div class="tabs" role="tablist" aria-label="Library"><button class="tab" role="tab" aria-selected="true" type="button">Playlists</button><button class="tab" role="tab" aria-selected="false" tabindex="-1" type="button">Liked</button><button class="tab" role="tab" aria-selected="false" tabindex="-1" type="button">Following</button></div>'
               '<div class="card-grid" style="margin-top:var(--space-4)">' + "".join(tile(p, "pl") for p in PLAYLISTS) + "</div>")
    def tabs(sel):
        return ('<div class="tabs" role="tablist" aria-label="Library">' + "".join(
            f'<button class="tab" role="tab" aria-selected="{"true" if n == sel else "false"}"{"" if n == sel else " tabindex=\"-1\""} type="button">{n}</button>'
            for n in ("Playlists", "Liked", "Following")) + "</div>")
    liked = tabs("Liked") + '<div style="margin-top:var(--space-4)">' + track_list(list(T)[:4], label="Liked tracks", liked=list(T)[:4]) + "</div>"
    following = tabs("Following") + '<div class="card-grid" style="margin-top:var(--space-4)">' + "".join(tile(a, "artist") for a in list(A)[:4]) + "</div>"
    c = {"default": default, "liked": liked, "following": following, "loading": skel_tiles(6),
         "empty": empty("library", "Your library is empty", "Like a track or create a playlist and it will live here, on every device you sign in on.", btn("Create a playlist", "primary", "plus", href=D("create-playlist")) + btn("Browse genres", "", href=P("browse"))),
         "error": err("Your library didn’t load"),
         "signed-out": empty("lock", "Sign in to see your library", "Playlists and liked tracks are saved to your account.", btn("Sign in", "primary", href=P("sign-in")) + btn("Create account", "", href=P("sign-up")))}
    return frame(state, "library", "Library", "3 playlists · 41 liked tracks · 6 artists" if state in ("default", "liked", "following") else "", c,
                 btn("New playlist", "primary", "plus", href=D("create-playlist")) if state in ("default", "liked", "following", "loading", "empty") else "", signed_in=state != "signed-out")


def now_playing(state):
    paused = state == "paused"
    return home("default", extra=now_playing_overlay(state), inert=True, pkw={"tid": "feathers-up", "playing": not paused})


def queue(state):
    return home("default", extra=queue_drawer(state))


def shared_track(state):
    t = T["wine-slow"]; a = A[t["artist"]]
    default = (f'<section class="hero">{cover(a["cover"])}<div class="stack"><span class="overline">Shared with you</span>'
               f'<p class="text-muted">Marisol Vega · Slow Wine · {t["dur"]} · {LICENCES[t["licence"]]}</p><div class="cluster">{btn("Play preview", "primary", "play")}{btn("Sign up to save it", "", href=P("sign-up"))}</div>{wave(0)}</div></section>'
               + alert("info", "Free to listen, free to keep", "Hummi is free. Create an account to save this track to a playlist, follow Marisol Vega and keep your place."))
    c = {"default": default, "loading": '<div class="skeleton skeleton--rect" style="height:14rem"></div>', "error": err("This link didn’t work", "The link may be incomplete or the track may have been removed.")}
    return frame(state, "home", "Wine Slow", "Marisol Vega", c, player=False, signed_in=False)


SCREENS = [
    dict(id="home", kind="page", title="Home", route="/", states=["default", "loading", "empty", "no-music", "error", "offline", "partial", "kids"], render=home, desc="Home with the featured album billboard and shelves of tracks"),
    dict(id="browse", kind="page", title="Browse", route="/browse", states=["default", "loading", "error"], na={"empty": "Genres and moods are fixed catalogue categories; the list is never empty."}, render=browse, desc="Genre and mood directory"),
    dict(id="genre", kind="page", title="Genre", route="/genres/:slug", states=["default", "loading", "empty", "error"], render=genre, desc="Tracks in one genre with play-all and sort"),
    dict(id="search", kind="page", title="Search", route="/search", states=["default", "loading", "empty", "no-results", "error"], render=search, desc="Search overlay over the current page: recent searches, browse by sound and results"),
    dict(id="track", kind="page", title="Track", route="/tracks/:id", states=["default", "loading", "error", "unavailable"], na={"empty": "A track page always has its track; a missing track is the 404 screen."}, render=track, desc="Track details with waveform, source, licence and credit"),
    dict(id="artist", kind="page", title="Artist", route="/artists/:id", states=["default", "loading", "empty", "error"], render=artist, desc="Artist profile with popular tracks and releases"),
    dict(id="album", kind="page", title="Album", route="/albums/:id", states=["default", "loading", "error"], na={"empty": "An album exists only when it has at least one track."}, render=album, desc="Album track list and licence summary"),
    dict(id="playlist", kind="page", title="Playlist", route="/playlists/:id", states=["default", "loading", "empty", "error", "selected", "read-only"], render=playlist, desc="Playlist with owner actions, multi-select and read-only view of someone else's playlist"),
    dict(id="library", kind="page", title="Library", route="/library", states=["default", "liked", "following", "loading", "empty", "error", "signed-out"], render=library, desc="Saved playlists, liked tracks and followed artists"),
    dict(id="now-playing", kind="page", title="Now playing", route="/now-playing", states=["default", "paused", "loading", "empty", "error"], render=now_playing, desc="Full-screen Now playing layer with scrubber, controls and up next"),
    dict(id="queue", kind="page", title="Queue", route="/queue", states=["default", "loading", "empty", "error"], render=queue, desc="Queue drawer: now playing, up next and more from the genre"),
    dict(id="shared-track", kind="page", title="Shared track", route="/s/:code", states=["default", "loading", "error"], na={"empty": "A shared link points at exactly one track."}, render=shared_track, desc="Logged-out landing page for a shared track link"),
]

"""Component specs: Hummi media components."""
from comps_a import IC, B

SPECS = []
NOTE = IC('<path d="M9 18V6l11-2v12M9 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3zM20 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3z"/>')
COV = lambda c, extra="": f'<div class="cover cover--{c}{extra}" aria-hidden="true">{NOTE}</div>'
HEART = IC('<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>')
MORE = IC('<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>')

SPECS.append(dict(
    slug="cover", name="Cover", group="Media", lead="Generated artwork tile for a track, album or playlist.",
    overview="Hummi tracks are AI-generated, so artwork is a gradient tile with the music glyph; six colourways keep artists distinguishable. A cover is decorative: the title next to it is the name.",
    parts=[("Tile", "Square with <code>--radius-lg</code> (md when small)"), ("Gradient", "From and to tokens per colourway"), ("Glyph", "Music note at 38% of the tile")],
    variants=[(f"Colourway {i}", f'<div style="width:6rem">{COV("c" + str(i))}</div>') for i in range(1, 7)] + [("Round (artist)", '<div style="width:6rem"><div class="cover cover--c1 round" aria-hidden="true">' + IC('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>') + "</div></div>")],
    sizes=[("Small (3rem)", COV("c1", " cover--sm")), ("Medium (4rem)", COV("c1", " cover--md")), ("Fluid", f'<div style="width:8rem">{COV("c1")}</div>')],
    states=None, responsive="Fluid covers fill their grid cell and keep a 1:1 ratio; fixed sizes never shrink.",
    a11y=dict(role="Decorative: <code>aria-hidden=\"true\"</code>.", keys=[("n/a", "Not interactive")], focus="Not focusable.", label="Never the only place a title appears.", pairs=[("Glyph on start colour 1", "--color-fg-on-media", "--color-cover-1-from", 3), ("Glyph on start colour 3", "--color-fg-on-media", "--color-cover-3-from", 3)]),
    content="<p>No text on covers; titles are separate.</p>",
    dodont=[(COV("c1", " cover--md"), "Decorative and hidden.", '<div class="cover cover--c1 cover--md" role="img" aria-label="Cover">' + NOTE + "</div>", "A meaningless label."), (f'<div style="width:6rem">{COV("c2")}</div>', "Square ratio.", '<div class="cover cover--c2" style="width:6rem;aspect-ratio:2"></div>', "Stretched ratio.")],
    tokens=[("Colourway 1 from", "--color-cover-1-from"), ("Colourway 1 to", "--color-cover-1-to"), ("Colourway 3 from", "--color-cover-3-from"), ("Glyph", "--color-fg-on-media"), ("Radius", "--radius-lg")], classes=[("cover", "Tile"), ("cover--c1 … c6", "Colourways"), ("cover--sm / --md", "Fixed sizes"), ("round", "Circle for artists")], sources=["pages/home/default", "pages/track/default", "pages/artist/default"]))

TR = f'<ol class="track-list" aria-label="Tracks"><li class="track"><span class="track__num">1</span>{COV("c1", " cover--sm")}<div style="min-width:0"><div class="track__title">Glass Rain</div><div class="track__meta">Lumen Fox · 3:48</div></div><div class="track__actions"><button class="btn btn--ghost btn--icon" type="button" aria-label="Like Glass Rain" aria-pressed="false">{HEART}</button><button class="btn btn--ghost btn--icon" type="button" aria-label="More actions for Glass Rain">{MORE}</button></div></li></ol>'
TRP = TR.replace('<li class="track">', '<li class="track" aria-current="true">').replace('<span class="track__num">1</span>', '<span class="track__num"><span class="eq" role="img" aria-label="Playing"><span></span><span></span><span></span></span></span>')
SPECS.append(dict(
    slug="track-row", name="Track row", group="Media", lead="One track in a list: number, cover, title, artist, duration and actions.",
    overview="The workhorse of Hummi: used in playlists, search, queue and genre pages. The title links to the track page; actions stay on the row.",
    parts=[("Number or equaliser", "Index; equaliser bars while playing"), ("Cover", "3rem, decorative"), ("Title and meta", "Truncate with ellipsis, never wrap"), ("Actions", "Like and More, 44px targets")],
    figure=TR, variants=[("Default", TR), ("Playing", TRP)],
    sizes=None, sizes_na="Row height is 44px minimum, from the touch-target token.",
    states=dict(rows=[("Row", TR.replace('<li class="track">', '<li class="track"{a}>'))], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Playing", ' aria-current="true"')]),
    responsive="Under 640px the artist and duration share one line under the title; the number column hides on screens narrower than 360px.",
    a11y=dict(role="List item in an <code>&lt;ol&gt;</code>; the playing row has <code>aria-current=\"true\"</code>.", keys=[("Tab", "Title link, Like, More"), ("Enter", "Opens the track page"), ("Space on Like", "Toggles like")], focus="Ring on each control, not on the row.", label="Like and More buttons name the track: “Like Glass Rain”.", pairs=[("Title", "--color-fg-default", "--color-bg-canvas", 4.5), ("Meta", "--color-fg-muted", "--color-bg-canvas", 4.5), ("Playing row", "--color-fg-default", "--color-accent-subtle", 4.5)],
              motion="Equaliser bars are static: the glyph shows playing without animation."),
    content="<p>Meta is “Artist · duration”. Long titles truncate; the full title is on the track page.</p>",
    dodont=[(TR, "Name the track in action labels.", TR.replace("Like Glass Rain", "Like"), "Identical labels in a list."), (TR, "Truncate long titles.", TR.replace("Glass Rain", "The Quiet Between Two Lighthouses, Revisited (Extended Dream Mix) with a very long suffix").replace('<div class="track__title">', '<div style="white-space:normal">'), "Wrapping makes rows uneven.")],
    tokens=[("Hover", "--color-bg-subtle"), ("Playing background", "--color-accent-subtle"), ("Equaliser", "--color-fg-accent"), ("Meta", "--color-fg-muted"), ("Radius", "--radius-md")], classes=[("track-list", "Ordered list"), ("track", "Row"), ("track__num / __title / __meta / __actions", "Parts"), ("eq", "Playing indicator")], sources=["pages/playlist/default", "pages/queue/default", "pages/search/default"]))

TILE = f'<a class="tile" href="#code" style="max-width:10rem">{COV("c3")}<div class="tile__title truncate">Blue Hour Bounce</div><div class="tile__meta truncate">Marlow &amp; the Machines</div></a>'
SPECS.append(dict(
    slug="media-tile", name="Media tile", group="Media", lead="A clickable tile for a track, artist or playlist in a grid shelf.",
    overview="Use in shelves such as Continue listening. One link covers the tile; there are no nested controls.",
    parts=[("Cover", "Square or round for artists"), ("Title", "Truncated to one line"), ("Meta", "Artist, count or listeners")],
    figure=TILE, variants=[("Track", TILE), ("Artist", f'<a class="tile" href="#code" style="max-width:10rem"><div class="cover cover--c1 round" aria-hidden="true">{IC("<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>")}</div><div class="tile__title truncate">Lumen Fox</div><div class="tile__meta">48,210 monthly listeners</div></a>')],
    sizes=None, sizes_na="Tiles fill their grid cell.",
    states=dict(rows=[("Tile", TILE.replace('class="tile"', 'class="tile"{a}'))], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="<code>tile-grid</code> shows 2 columns on phones, 4 from 768px and 6 from 1024px.",
    a11y=dict(role="A single <code>&lt;a&gt;</code> around the tile.", keys=[("Tab", "Moves between tiles"), ("Enter", "Opens the item")], focus="Ring around the tile.", label="Link name is the title plus meta, read in order.", pairs=[("Title", "--color-fg-default", "--color-bg-surface", 4.5), ("Meta", "--color-fg-muted", "--color-bg-surface", 4.5)]),
    content="<p>Title is the item name; meta never repeats it.</p>",
    dodont=[(TILE, "One link for the whole tile.", TILE.replace("</a>", '<button class="btn btn--sm" type="button">Play</button></a>'), "A button inside a link is invalid."), (TILE, "Truncate.", TILE.replace("truncate", ""), "Unbounded wrapping breaks the grid.")],
    tokens=[("Background", "--color-bg-surface"), ("Hover background", "--color-bg-subtle"), ("Border", "--color-border-default"), ("Radius", "--radius-lg"), ("Shadow on hover", "--shadow-2")], classes=[("tile-grid", "Responsive grid"), ("tile", "Tile link"), ("tile__title / tile__meta", "Text")], sources=["pages/home/default", "pages/library/default"]))

GT = '<a class="genre-tile cover--c5" href="#code" style="max-width:12rem">Synthwave</a>'
SPECS.append(dict(
    slug="genre-tile", name="Genre tile", group="Media", lead="A bold coloured tile that links to a genre.",
    overview="Used on Browse and the first-run Home. Colour follows the cover colourways.",
    parts=[("Gradient", "Cover colourway"), ("Label", "Genre name, h4 weight, bottom left")],
    variants=[("Default", GT), ("All colourways", "".join(f'<a class="genre-tile cover--c{i}" href="#code" style="max-width:8rem">Genre {i}</a> ' for i in range(1, 7)))],
    sizes=None, sizes_na="Min height 6rem; width follows the grid.", states=dict(rows=[("Tile", '<a class="genre-tile cover--c1" href="#code"{a} style="max-width:12rem">Ambient</a>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Same grid as media tiles.",
    a11y=dict(role="A link whose text is the genre.", keys=[("Enter", "Opens the genre")], focus="Ring around the tile.", label="The genre name.", pairs=[("Label on colourway 1", "--color-fg-on-media", "--color-cover-1-from", 4.5), ("Label on colourway 3", "--color-fg-on-media", "--color-cover-3-from", 4.5), ("Label on colourway 5", "--color-fg-on-media", "--color-cover-5-from", 4.5)]),
    content="<p>One or two words, sentence case (“Hip hop”).</p>",
    dodont=[(GT, "Short genre name.", GT.replace("Synthwave", "Music with retro-futuristic synthesisers and drum machines"), "Descriptions do not fit."), (GT, "White label on a dark gradient.", GT.replace('class="genre-tile cover--c5"', 'class="genre-tile cover--c5" style="color:var(--color-fg-default)"'), "Dark text fails contrast.")],
    tokens=[("Label", "--color-fg-on-media"), ("Colourway 5 from", "--color-cover-5-from"), ("Radius", "--radius-lg")], classes=[("genre-tile", "Tile"), ("cover--c1 … c6", "Colourway")], sources=["pages/browse/default", "pages/home/empty"]))

PLAYER = ('<section class="player" style="position:static" aria-label="Player"><a class="player__now" href="#code">' + COV("c1", " cover--sm") + '<div style="min-width:0"><div class="track__title">Slow Orbit</div><div class="track__meta">Lumen Fox</div></div></a>'
          '<div class="player__controls"><button class="btn btn--ghost btn--icon" type="button" aria-label="Previous track">' + IC('<path d="M18 5 8 12l10 7zM5 5v14"/>') + '</button><button class="btn btn--primary btn--icon" type="button" aria-label="Pause">' + IC('<path d="M8 5v14M16 5v14"/>') + '</button><button class="btn btn--ghost btn--icon" type="button" aria-label="Next track">' + IC('<path d="M6 5l10 7-10 7zM19 5v14"/>') + '</button></div>'
          '<div class="player__scrub scrub"><span>1:24</span><div class="progress" role="progressbar" aria-label="Track position" aria-valuemin="0" aria-valuemax="252" aria-valuenow="84"><div class="progress__bar" style="width:33%"></div></div><span>4:12</span></div></section>')
SPECS.append(dict(
    slug="player-bar", name="Player bar", group="Media", lead="The persistent mini player fixed to the bottom of every page.",
    overview="Shows the current track and the core controls. It links to the full Now playing page. Pages reserve room for it with <code>has-player</code>.",
    parts=[("Now playing", "Cover, title and artist; links to Now playing"), ("Controls", "Previous, play/pause, next"), ("Scrub", "Elapsed time, progress, duration"), ("Extras (desktop)", "Queue and volume")],
    figure=PLAYER, variants=[("Playing", PLAYER), ("Disabled (nothing queued)", PLAYER.replace('aria-label="Previous track"', 'aria-label="Previous track" disabled').replace('aria-label="Next track"', 'aria-label="Next track" disabled'))],
    sizes=None, sizes_na="Height follows content: one row on desktop, two on phones.",
    states=dict(rows=[("Play/pause", '<button class="btn btn--primary btn--icon" type="button" aria-label="Play"{a}>' + IC('<path d="M7 4.5v15l12-7.5z"/>') + "</button>")], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Disabled", " disabled")]),
    responsive="Below 1024px the bar spans the full width on two rows (track and controls, then scrub). From 1024px it sits to the right of the sidebar in three columns.",
    a11y=dict(role="<code>&lt;section aria-label=\"Player\"&gt;</code> with buttons; position uses a labelled progress bar.", keys=[("Space", "Play or pause when focus is not in a text field"), ("← / →", "Previous or next track"), ("Tab", "Now playing link, controls")], focus="Ring on each control; focus is never moved by track changes.", label="Controls are named by action; the play button’s name flips between Play and Pause.", pairs=[("Title", "--color-fg-default", "--color-bg-surface-raised", 4.5), ("Meta", "--color-fg-muted", "--color-bg-surface-raised", 4.5), ("Time", "--color-fg-muted", "--color-bg-surface-raised", 4.5)],
              touch="Controls are 44px; the scrub rail has a 24px-tall hit area."),
    content="<p>Title and artist truncate to one line. Playback errors replace the artist line: “Playback stopped. Check your connection.”</p>",
    dodont=[(PLAYER, "Controls named by action.", PLAYER.replace('aria-label="Pause"', 'aria-label="Button"'), "Generic names."), (PLAYER, "Bar persists across pages.", '<p>(A player that reloads on every page.)</p>', "Playback must survive navigation.")],
    tokens=[("Background", "--color-bg-surface-raised"), ("Border", "--color-border-default"), ("Shadow", "--shadow-3"), ("Layer", "--z-sticky"), ("Progress", "--color-accent")], classes=[("player", "Fixed bar"), ("player__now / __controls / __scrub / __extra", "Regions"), ("scrub", "Time and rail row"), ("has-player", "Adds bottom padding to the page")], sources=["pages/home/default", "pages/now-playing/default", "pages/now-playing/error"]))

WAVE_BARS = "".join(f'<span class="{"is-played" if i < 21 else ""}" style="height:{25 + (i * 37) % 70}%"></span>' for i in range(64))
SPECS.append(dict(
    slug="waveform", name="Waveform", group="Media", lead="A visual summary of a track’s loudness with the played portion highlighted.",
    overview="Decorative and informative: it shows shape and position. Seeking uses the progress rail in the player; the waveform itself is a picture.",
    parts=[("Bars", "64 rounded bars"), ("Played portion", "Accent colour up to the current position")],
    variants=[("33% played", f'<div class="wave" role="img" aria-label="Waveform, 33% played">{WAVE_BARS}</div>'), ("Unplayed", f'<div class="wave" role="img" aria-label="Waveform, not played">{WAVE_BARS.replace("is-played", "")}</div>')],
    sizes=None, sizes_na="Height is 3rem.", states=None, responsive="Bars flex to the container width, never below 2px each.",
    a11y=dict(role="<code>role=\"img\"</code> with a label giving progress.", keys=[("n/a", "Not interactive")], focus="Not focusable.", label="Progress is in the label.", pairs=[("Played bar vs canvas", "--color-accent", "--color-bg-canvas", 3), ("Unplayed bar vs canvas", "--color-border-strong", "--color-bg-canvas", 3)]),
    content="<p>No text.</p>",
    dodont=[(f'<div class="wave" role="img" aria-label="Waveform, 33% played">{WAVE_BARS}</div>', "Labelled with progress.", f'<div class="wave">{WAVE_BARS}</div>', "No name."), (f'<div class="wave" role="img" aria-label="Waveform">{WAVE_BARS}</div>', "Rounded bars.", f'<div class="wave" role="img" aria-label="Waveform" style="gap:0">{WAVE_BARS}</div>', "Without gaps the bars fuse.")],
    tokens=[("Played", "--color-accent"), ("Unplayed", "--color-border-strong"), ("Radius", "--radius-full")], classes=[("wave", "Container"), ("is-played", "Played bars")], sources=["pages/track/default", "pages/now-playing/default"]))

HERO = f'<section class="hero" aria-label="Featured"><div class="cover cover--c1" aria-hidden="true">{NOTE}</div><div class="stack"><span class="overline">Made for you</span><h3 style="font:var(--text-h2)">Slow Orbit and 24 more like it</h3><p class="text-muted">Ambient from Lumen Fox, picked from what you played this week.</p><div class="cluster"><button class="btn btn--primary" type="button">Play</button></div></div></section>'
SPECS.append(dict(
    slug="hero", name="Hero", group="Media", lead="A featured block at the top of a page: cover, kicker, title, text and actions.",
    overview="Use once per page, for the thing that deserves most attention: a track, an artist or a recommendation.",
    parts=[("Cover", "12rem from 768px, full width on phones"), ("Kicker", "Overline context"), ("Title and text", "Heading and one sentence"), ("Actions", "Primary then secondary")],
    variants=[("Recommendation", HERO)], sizes=None, sizes_na="One size.", states=None,
    responsive="The cover stacks above the text under 768px; at 768px and above they sit side by side.",
    a11y=dict(role="<code>&lt;section aria-label&gt;</code> landmark region.", keys=[("Tab", "Reaches actions")], focus="Standard ring.", label="The h2/h3 heading names it.", pairs=[("Text on hero", "--color-fg-default", "--color-accent-subtle", 4.5), ("Muted text on hero", "--color-fg-muted", "--color-accent-subtle", 4.5)]),
    content="<p>Kicker names the reason (“Made for you”); title names the thing.</p>",
    dodont=[(HERO, "One hero per page.", HERO + HERO, "Two heroes compete."), (HERO, "One primary action.", HERO.replace("</div></div></section>", '<button class="btn btn--primary" type="button">Save</button></div></div></section>'), "Two primaries.")],
    tokens=[("Background", "--color-accent-subtle"), ("Border", "--color-border-default"), ("Radius", "--radius-xl")], classes=[("hero", "Container with gradient wash")], sources=["pages/home/default", "pages/track/default", "pages/shared-track/default"]))

NOTIF = '<ul class="list" style="list-style:none;padding:0"><li class="notif" data-unread="true">' + NOTE + '<div style="flex:1"><a href="#code">Lumen Fox</a> released <strong>Glass Rain</strong>.<div class="text-caption">2 hours ago</div></div><span class="dot" role="img" aria-label="Unread"></span></li><li class="notif" data-unread="false">' + NOTE + '<div style="flex:1">Hummi now shows the model that generated each track.<div class="text-caption">Mon 19 Oct</div></div></li></ul>'
SPECS.append(dict(
    slug="notification-item", name="Notification item", group="Media", lead="One entry in the notification centre, unread or read.",
    overview="Appears only on the Notifications page; transient messages use toasts and banners.",
    parts=[("Icon", "Type of event"), ("Text", "Event with link, then time"), ("Unread dot", "Accent dot with a spoken label")],
    variants=[("Unread and read", NOTIF)], sizes=None, sizes_na="Row height follows content.", states=dict(rows=[("Item", '<ul class="list" style="list-style:none;padding:0"><li class="notif"{a}>' + NOTE + "<div>Event</div></li></ul>")], cols=[("Read", ' data-unread="false"'), ("Unread", ' data-unread="true"')]),
    responsive="Full-width rows; time wraps below the text on narrow screens.",
    a11y=dict(role="List item with links inside.", keys=[("Tab", "Reaches links")], focus="Ring on links.", label="Unread dot has <code>aria-label=\"Unread\"</code>; unread is never colour only.", pairs=[("Text on unread", "--color-fg-default", "--color-accent-subtle", 4.5)]),
    content="<p>Name the actor, the event and the thing: “Mei shared Sunday kitchen with you”.</p>",
    dodont=[(NOTIF, "Time on its own line.", NOTIF.replace('<div class="text-caption">2 hours ago</div>', ""), "No time."), (NOTIF, "Unread dot is labelled.", NOTIF.replace(' role="img" aria-label="Unread"', ""), "Unlabelled dot.")],
    tokens=[("Unread background", "--color-accent-subtle"), ("Dot", "--color-accent"), ("Radius", "--radius-md")], classes=[("notif", "Row"), ("data-unread", "Unread styling"), ("dot", "Unread marker")], sources=["pages/notifications/default", "pages/notifications/read"]))

SRCH = IC('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>')
CLOSE = IC('<path d="M6 6l12 12M18 6 6 18"/>')
CLOCK = IC('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>')
BAR = lambda q: (f'<div class="layer-search__bar" style="position:static">{SRCH}<input class="layer-search__input" type="search" aria-label="Search songs and artists" placeholder="Search songs and artists" value="{q}">'
                 + ('<button class="layer-search__clear" type="button">Clear</button>' if q else "") + f'<button class="layer-search__close" type="button" aria-label="Close search">{CLOSE}</button></div>')
SROW = (f'<div class="srow">{COV("c2", " cover--sm")}<div class="srow__text"><a class="srow__title" href="#code" style="color:inherit;text-decoration:none"><span>Panyard Nights</span></a><div class="srow__sub">Laventille Steel Orchestra</div></div>'
        f'<span class="srow__dur">6:40</span><button class="ibtn" type="button" aria-label="More actions for Panyard Nights">{MORE}</button></div>')
SROWP = SROW.replace('<div class="srow">', '<div class="srow" aria-current="true">').replace('<span>Panyard Nights</span>', '<span class="eq eq--live" role="img" aria-label="Playing"><span></span><span></span><span></span></span><span>Panyard Nights</span>')
TOP = f'<a class="top-result" href="#code" style="max-width:20rem">{COV("c2")}<strong>Panyard Nights</strong><span>Laventille Steel Orchestra · 6:40</span></a>'
RECENT = f'<ul class="recent"><li><button type="button" style="all:unset;display:flex;gap:.75rem;align-items:center;padding:.625rem .75rem">{CLOCK}Kaiso Collective</button></li></ul>'
SOUND = f'<a class="sound" href="#code" style="max-width:10rem">{COV("c1")}<span class="sound__cap"><strong>Soca</strong><small>1,204 tracks</small></span></a>'
PILL = f'<button class="search-pill" type="button" style="display:flex" aria-label="Search songs and artists">{SRCH}<span>Search songs and artists</span><kbd aria-hidden="true">/</kbd></button>'
SPECS.append(dict(
    slug="search-layer", name="Search layer", group="Media", lead="The header search pill and the layer that drops in over the page: query bar, top result, result rows, recent searches and sound tiles.",
    overview="Search is a layer, not a page (ADR 0004). The pill in the header opens it; the bar keeps the query; results group into a Top result card, Artists and Songs rows. With an empty query it lists recent searches and Browse by sound tiles.",
    parts=[("Search pill", "<code>search-pill</code> in the header end slot with the / key hint"), ("Bar", "<code>layer-search__bar</code>: icon, input, Clear (only with text), Close"), ("Top result", "<code>top-result</code>: cover, title, “artist · duration”"), ("Result row", "<code>srow</code> (songs) and <code>srow--artist</code>"), ("Recent", "<code>recent</code> list with clock icons"), ("Sound tile", "<code>sound</code> genre tile with title and “{n} tracks”")],
    figure=BAR("pan"), variants=[("Search pill", PILL), ("Bar, empty", BAR("")), ("Bar, with text", BAR("pan")), ("Top result", TOP), ("Song row", SROW), ("Song row, playing", SROWP), ("Recent search", RECENT), ("Sound tile", SOUND)],
    sizes=None, sizes_na="The layer spans the viewport width; rows and tiles fill their column.",
    states=None, responsive="Under 64rem results stack in one column; from 64rem the top result sits beside the lists and the empty state puts Recent beside Browse by sound. The pill shows from 48rem; below it an icon button opens search.",
    a11y=dict(role="The layer is <code>role=\"dialog\"</code> with <code>aria-modal</code> and the label “Search”; the playing row has <code>aria-current=\"true\"</code>.", keys=[("/", "Opens search when no text field is focused"), ("Escape", "Closes the layer"), ("Enter", "Searches at once")], focus="The query field takes focus on open; focus returns to the pill on close.", label="The input and pill are labelled “Search songs and artists”; More buttons name the track.", pairs=[("Row title", "--color-fg-default", "--color-bg-canvas", 4.5), ("Row meta", "--color-fg-muted", "--color-bg-canvas", 4.5), ("Playing title", "--color-fg-accent", "--color-bg-canvas", 4.5)],
              motion="The layer drops in over 200 ms; reduced motion removes the animation."),
    content="<p>No results: “Nothing matches “{query}”” with “Try an artist name, or a sound like soca, pan or lullaby.” Errors keep the query in the bar.</p>",
    dodont=[(SROW, "Name the track in the More label.", SROW.replace("More actions for Panyard Nights", "More"), "Identical labels in a list."), (BAR("pan"), "Clear appears once text is typed.", BAR("").replace("</div>", '<button class="layer-search__clear" type="button">Clear</button></div>', 1), "Clear with nothing to clear.")],
    tokens=[("Layer background", "--color-bg-canvas"), ("Scrim", "--color-bg-surface-sunken"), ("Accent icon", "--color-accent"), ("Playing title", "--color-fg-accent"), ("Layer", "--z-layer")], classes=[("search-pill", "Header pill"), ("scrim / layer-search", "Backdrop and layer"), ("layer-search__bar / __input / __clear / __close / __body", "Parts"), ("top-result", "Top result card"), ("srow / srow--artist", "Result rows"), ("recent", "Recent searches"), ("sound-grid / sound", "Browse by sound"), ("layer-empty", "No results")], sources=["pages/search/default", "pages/search/empty", "pages/search/loading", "pages/search/no-results", "pages/search/error"]))

CHEV = IC('<path d="m9 5 7 7-7 7"/>')
SHUF = IC('<path d="M3 7h4l10 10h4M3 17h4l3-3M14 10l3-3h4M19 4l2 3-2 3M19 14l2 3-2 3"/>')
REP = IC('<path d="M4 11V9a3 3 0 0 1 3-3h13M17 3l3 3-3 3M20 13v2a3 3 0 0 1-3 3H4M7 21l-3-3 3-3"/>')
SKIP = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5v14M18 5 9 12l9 7z"/></svg>'
PAUSE = '<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14M16 5v14"/></svg>'
SHARE_I = IC('<path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/>')
QUEUE_I = IC('<path d="M4 6h12M4 11h12M4 16h7M17 14v6l5-3z"/>')
SCRUB = ('<div class="scrubber scrubber--full"><time>1:14</time><div class="scrubber__track" role="progressbar" aria-label="Track position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="33">'
         '<div class="scrubber__fill" style="width:33%"></div><div class="scrubber__thumb" style="left:33%"></div></div><time>3:42</time></div>')
LP_CTRL = (f'<div class="layer-player__ctrl"><button class="ibtn ibtn--lg" type="button" aria-label="Shuffle" aria-pressed="false">{SHUF}</button><div class="mid">'
           f'<button class="ibtn ibtn--lg" type="button" aria-label="Previous track">{SKIP}</button><button class="ibtn ibtn--hero" type="button" aria-label="Pause">{PAUSE}</button>'
           f'<button class="ibtn ibtn--lg" style="rotate:180deg" type="button" aria-label="Next track">{SKIP}</button></div><button class="ibtn ibtn--lg" type="button" aria-label="Repeat" aria-pressed="true">{REP}</button></div>')
LP_ACTS = (f'<div class="layer-player__acts"><button class="pill-btn pill-btn--lg" type="button" aria-pressed="false">{HEART}Save</button><button class="pill-btn pill-btn--lg" type="button">{SHARE_I}Share</button>'
           f'<button class="pill-btn pill-btn--lg" type="button">{QUEUE_I}Queue</button><button class="ibtn ibtn--lg" type="button" aria-haspopup="menu" aria-label="More actions for Feathers Up">{MORE}</button></div>')
LP_ROW = f'<div class="srow">{COV("c2", " cover--sm")}<div class="srow__text"><div class="srow__title"><span>Road March Riddim</span></div><div class="srow__sub">Lady Tamboo</div></div><span class="srow__dur">4:05</span></div>'
LP = (f'<div class="layer-player" style="position:static;animation:none" role="dialog" aria-label="Now playing"><div class="layer-player__top"><button class="pill-btn" type="button"><span style="display:inline-flex;rotate:90deg">{CHEV}</span>Close</button>'
      f'<span class="layer-player__from">Playing from <b>Soca</b></span><span style="width:5.75rem"></span></div><div class="layer-player__body"><div class="layer-player__art">{COV("c1")}</div><div>'
      f'<h2 class="layer-player__title">Feathers Up</h2><p class="layer-player__artist">Kaiso Collective</p><div class="layer-player__scrub">{SCRUB}</div>{LP_CTRL}{LP_ACTS}'
      f'<section class="upnext" aria-label="Up next"><h3 class="layer-h">Up next</h3>{LP_ROW}</section></div></div></div>')
SPECS.append(dict(
    slug="player-layer", name="Now playing layer", group="Media", lead="The full-screen layer for the current track: cover, scrubber, transport with Shuffle and Repeat, actions and Up next.",
    overview="Opens from the player bar (cover, title or Expand) at <code>/now-playing</code>; the player bar hides while it is open. It renders the player state and emits every action; the host wires them (ADR 0009).",
    parts=[("Top", "Close pill and “Playing from {genre}”"), ("Art", "Large cover"), ("Title and artist", "Display title, muted artist"), ("Scrubber", "<code>scrubber--full</code> with elapsed and total"), ("Controls", "Shuffle, Previous, Play/Pause (hero), Next, Repeat"), ("Actions", "Save, Share, Queue, More actions"), ("Up next", "The next two tracks")],
    figure=LP, variants=[("Playing", LP), ("Controls, Repeat on", LP_CTRL), ("Actions", LP_ACTS)],
    sizes=None, sizes_na="The layer fills the viewport.",
    states=dict(rows=[("Mode toggle", f'<button class="ibtn ibtn--lg" type="button" aria-label="Shuffle"{{a}}>{SHUF}</button>')], cols=[("Off", ' aria-pressed="false"'), ("On", ' aria-pressed="true"'), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Under 64rem the cover sits above the details in one column; from 64rem the cover (up to 32.5rem) and the details sit side by side.",
    a11y=dict(role="<code>role=\"dialog\"</code> with <code>aria-modal</code> and the label “Now playing”; Shuffle and Repeat use <code>aria-pressed</code>; Up next is a labelled region.", keys=[("Escape", "Closes the layer"), ("Tab", "Close, controls, actions"), ("Space / → / ←", "Shortcuts (L2-017)")], focus="Close takes focus on open; focus returns to the page on close.", label="The play button is named Pause or Play; More actions names the track.", pairs=[("Title", "--color-fg-default", "--color-bg-surface-sunken", 4.5), ("Playing from", "--color-fg-muted", "--color-bg-surface-sunken", 4.5), ("Hero icon", "--color-fg-on-accent", "--color-accent", 3)],
              motion="The layer rises in over 260 ms; reduced motion removes it."),
    content="<p>Lost connection: “Playback stopped” with “We lost the connection while streaming {title}. We’ll resume from {position} once you’re back online.” Nothing loaded: “Nothing is playing” with Browse genres.</p>",
    dodont=[(LP_CTRL, "Modes are pressed toggles.", LP_CTRL.replace(' aria-pressed="true"', "").replace(' aria-pressed="false"', ""), "A toggle without a pressed state hides the mode."), (LP_ACTS, "Name the track in More actions.", LP_ACTS.replace("More actions for Feathers Up", "More"), "Ambiguous label.")],
    tokens=[("Background", "--color-bg-surface-sunken"), ("Hero button", "--color-accent"), ("Hero icon", "--color-fg-on-accent"), ("Layer", "--z-layer")], classes=[("layer-player", "Full-screen layer"), ("layer-player__top / __from / __body / __art / __title / __artist / __scrub / __ctrl / __acts", "Parts"), ("ibtn--lg / ibtn--hero", "Large and hero controls"), ("pill-btn / pill-btn--lg", "Action pills"), ("upnext", "Up next list"), ("scrubber--full", "Large scrubber")], sources=["pages/now-playing/default", "pages/now-playing/paused", "pages/now-playing/empty", "pages/now-playing/error"]))

CLOSE_I = IC('<path d="M6 6l12 12M18 6 6 18"/>')
QROW = lambda t, a, end: f'<div class="q-row">{COV("c3", " cover--sm")}<div class="srow__text"><div class="srow__title"><span>{t}</span></div><div class="srow__sub">{a}</div></div>{end}</div>'
QD = (f'<aside class="drawer-queue" style="position:static;animation:none" aria-label="Queue"><div class="drawer-queue__head"><h2>Queue</h2><button class="ibtn" type="button" aria-label="Close queue">{CLOSE_I}</button></div>'
      f'<div class="drawer-queue__body"><div class="q-label"><span>Now playing</span></div><div class="q-row q-row--now">{COV("c1", " cover--sm")}<div class="srow__text"><div class="srow__title"><span class="eq eq--live" role="img" aria-label="Playing"><span></span><span></span><span></span></span><span>Feathers Up</span></div><div class="srow__sub">Kaiso Collective</div></div></div>'
      f'<div class="q-label"><span>Up next · 1</span><button type="button">Clear</button></div>{QROW("Road March Riddim", "Lady Tamboo", f"<button class=ibtn type=button aria-label=\"Remove Road March Riddim from the queue\">{CLOSE_I}</button>")}'
      f'<div class="q-label"><span>Then, more Soca</span></div>{QROW("Wine Slow", "Marisol Vega", "<span class=srow__dur>3:30</span>").replace("q-row", "q-row q-row--more", 1)}</div></aside>')
QE = '<p class="q-empty">Use Play next or Add to queue on any track to line it up here.</p>'
SPECS.append(dict(
    slug="queue-drawer", name="Queue drawer", group="Media", lead="A non-modal panel at the top right listing Now playing, Up next and more from the genre.",
    overview="Opens from the player bar, Now playing or Q, without a backdrop, so the page stays usable. Edits apply at once; Play next and Add to queue on a track menu fill it.",
    parts=[("Head", "“Queue” and Close"), ("Now playing", "<code>q-row--now</code> with the live equaliser"), ("Up next", "Count, Clear and a remove button per row"), ("Then, more", "Up to four dimmed genre tracks with durations")],
    figure=QD, variants=[("With tracks", QD), ("Empty hint", QE)],
    sizes=None, sizes_na="23.75rem wide, never wider than the viewport less 1.5rem.", states=None,
    responsive="The drawer keeps its width down to phones, where it spans the viewport less a 0.75rem margin; it stops above the player bar.",
    a11y=dict(role="<code>&lt;aside aria-label=\"Queue\"&gt;</code>, not modal; the playing marker is <code>role=\"img\"</code> “Playing”.", keys=[("Escape", "Closes the drawer"), ("Tab", "Close, Clear, remove buttons")], focus="Close queue takes focus on open.", label="Remove buttons name the track: “Remove {title} from the queue”.", pairs=[("Row title", "--color-fg-default", "--color-bg-surface-raised", 4.5), ("Label", "--color-fg-muted", "--color-bg-surface-raised", 4.5)]),
    content="<p>Empty: “Use Play next or Add to queue on any track to line it up here.” The count follows “Up next · ” only when tracks are queued.</p>",
    dodont=[(QD, "Name the track in each remove button.", QD.replace("Remove Road March Riddim from the queue", "Remove"), "Identical labels."), (QE, "Say how to fill an empty queue.", '<p class="q-empty">Empty</p>', "A dead end.")],
    tokens=[("Background", "--color-bg-surface-raised"), ("Muted text", "--color-fg-muted"), ("Layer", "--z-player")], classes=[("drawer-queue / __head / __body", "Drawer"), ("q-label", "Section label with optional button"), ("q-row / q-row--now / q-row--more", "Rows"), ("q-empty", "Empty hint")], sources=["pages/queue/default", "pages/queue/empty"]))

MI = lambda ic, t, extra="": f'<button class="mi" role="menuitem" type="button"{extra}>{IC(ic)}{t}</button>'
TM = (f'<div class="menu-panel menu-panel--track" style="position:static;animation:none" role="menu" aria-label="Track actions"><div class="menu-head">{COV("c1", " cover--sm")}<div style="min-width:0"><strong>Feathers Up</strong><small>Kaiso Collective · 3:42</small></div></div>'
      + MI('<path d="M4 6h12M4 12h8M4 18h8M17 14v6M14 17h6"/>', "Play next") + MI('<path d="M4 6h16M4 12h16M4 18h8M16 16l3 2-3 2"/>', "Add to queue")
      + MI('<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>', "Save to library") + MI('<path d="M12 15V3m0 0L8 7m4-4 4 4M5 12v8h14v-8"/>', "Share")
      + '<hr class="menu-divider">' + MI('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>', "More from Kaiso Collective")
      + MI('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>', "Go to Soca") + '</div>')
SPECS.append(dict(
    slug="track-menu", name="Track menu", group="Media", lead="The More actions menu of one track: queue it, save it, share it, or go to its artist or genre.",
    overview="Opens from a card, a track row, a search song, the player bar or Now playing, anchored to the button that opened it and kept inside the viewport. A transparent scrim closes it on outside clicks.",
    parts=[("Head", "Cover, title and “{artist} · {duration}”"), ("Queue items", "Play next, Add to queue"), ("Library and sharing", "Save to library (Remove from library when saved), Share"), ("Go to", "More from {artist}, Go to {genre}")],
    figure=TM, variants=[("Default", TM), ("Saved", TM.replace('type="button">' + IC('<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>') + "Save to library", 'type="button" aria-pressed="true">' + IC('<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>') + "Remove from library"))],
    sizes=None, sizes_na="16rem wide.", states=dict(rows=[("Item", '<button class="mi" role="menuitem" type="button"{a}>Play next</button>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Pressed", ' aria-pressed="true"')]),
    responsive="Opens below its anchor, right-aligned; flips above when there is no room; stays 8px inside every viewport edge.",
    a11y=dict(role="<code>role=\"menu\"</code> “Track actions” with <code>menuitem</code> buttons.", keys=[("↑ / ↓", "Move between items"), ("Enter / Space", "Choose"), ("Escape / Tab", "Close; focus returns to the opener")], focus="The first item takes focus on open.", label="Items are named by their text.", pairs=[("Item", "--color-fg-default", "--color-bg-surface-raised", 4.5), ("Meta", "--color-fg-muted", "--color-bg-surface-raised", 4.5)]),
    content="<p>Choosing Play next or Add to queue confirms with a toast pill (L2-041).</p>",
    dodont=[(TM, "Show which track the menu acts on.", TM.split('<div class="menu-head">')[0] + TM.split("</small></div></div>")[1], "Without the head the target is unclear."), (TM, "Keep it inside the viewport.", "<p>(A menu cut off by the window edge.)</p>", "Unreachable items.")],
    tokens=[("Background", "--color-bg-surface-raised"), ("Pressed", "--color-fg-accent"), ("Layer", "--z-menu")], classes=[("menu-scrim", "Outside-click catcher"), ("menu-panel / menu-panel--track", "Panel"), ("menu-head", "Track head"), ("mi", "Item"), ("menu-divider", "Separator")], sources=["dialogs/track-menu/default", "dialogs/track-menu/saved", "dialogs/track-menu/from-player"]))

TP = lambda msg, undo=False, dot=False: (f'<div class="toast{" toast--undo" if undo else ""}" style="position:static">' + ('<span class="toast__dot" aria-hidden="true"></span>' if dot else COV("c1", " cover--sm"))
                                         + f'<span class="toast__msg">{msg}</span>' + ('<button class="toast__undo" type="button">Undo</button>' if undo else "") + "</div>")
SPECS.append(dict(
    slug="toast-pill", name="Toast pill", group="Feedback", lead="A short confirmation pill centred above the player bar, with the track cover and an optional Undo.",
    overview="<code>ToastService.show()</code> queues pills in <code>hm-toast-region</code>; each dismisses itself after 4 seconds. Problems are banners or inline errors, never toasts.",
    parts=[("Lead", "Track cover, or the coral dot"), ("Message", "One bold line"), ("Undo", "Optional action that reverts")],
    figure=TP("Added “Feathers Up” to your queue"), variants=[("Queue", TP("Added “Feathers Up” to your queue")), ("Play next", TP("“Feathers Up” will play next")), ("With Undo", TP("Saved “Feathers Up” to your library", undo=True)), ("No cover", TP("Downloads are saved for offline listening on this device", dot=True))],
    sizes=None, sizes_na="Width follows the message, up to the viewport less 2rem.", states=None,
    responsive="Centred horizontally; sits above the player bar, or 1.5rem from the bottom (<code>toast-region--noplayer</code>) when no player is shown.",
    a11y=dict(role="The region is <code>role=\"status\"</code> with <code>aria-live=\"polite\"</code>.", keys=[("Tab", "Reaches Undo")], focus="Toasts never take focus.", label="The message is the content.", pairs=[("Message", "--color-bg-canvas", "--color-fg-default", 4.5)]),
    content="<p>Messages: “Added “{title}” to your queue”, ““{title}” will play next”, “Saved “{title}” to your library”, “Removed “{title}” from your library”.</p>",
    dodont=[(TP("Added “Feathers Up” to your queue"), "Name the track.", TP("Added to queue"), "Which track?"), (TP("“Feathers Up” will play next"), "One line.", TP("“Feathers Up” will play next. It plays after the current track and before the rest of your queue."), "Pills are not paragraphs.")],
    tokens=[("Background", "--color-fg-default"), ("Text", "--color-bg-canvas"), ("Dot", "--color-accent"), ("Layer", "--z-toast-pill")], classes=[("toast-region / toast-region--noplayer", "Live region"), ("toast / toast--undo", "Pill"), ("toast__dot / toast__msg / toast__undo", "Parts")], sources=["notifications/toast/info", "notifications/toast/play-next", "notifications/toast/success"]))

AM = (f'<div class="menu-panel menu-panel--account" style="position:static;animation:none" role="menu" aria-label="Account"><div class="menu-id"><span class="avatar">N</span><div><strong>Nadia Charles</strong><small>nadia@hummi.fm</small></div></div>'
      + '<hr class="menu-divider">' + MI('<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>', "Sign out") + '</div>')
SPECS.append(dict(
    slug="account-menu", name="Account menu", group="Navigation", lead="The menu under the header avatar: who is signed in, the account destinations, then Sign out.",
    overview="Opens from the avatar button in the header, right-aligned below it. A transparent scrim closes it on outside clicks; the page beneath stays visible (L2-052). Destinations are added by the journeys that build them; Sign out is always last, below a divider.",
    parts=[("Identity", "Avatar initial, display name and email"), ("Items", "Projected menu items, such as Your library and Settings"), ("Sign out", "Below a divider; opens the Sign out of Hummi? dialog")],
    figure=AM, variants=[("Signed in", AM)],
    sizes=None, sizes_na="16rem wide.", states=dict(rows=[("Item", '<button class="mi" role="menuitem" type="button"{a}>Sign out</button>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Anchored to the avatar, right-aligned; stays 8px inside every viewport edge.",
    a11y=dict(role="<code>role=\"menu\"</code> “Account” with <code>menuitem</code> items; the avatar button has <code>aria-haspopup=\"menu\"</code> and <code>aria-expanded</code>.", keys=[("↑ / ↓", "Move between items"), ("Escape", "Close; focus returns to the avatar")], focus="The first item takes focus on open.", label="The avatar is named “Account: {name}”.", pairs=[("Name", "--color-fg-default", "--color-bg-surface-raised", 4.5), ("Email", "--color-fg-muted", "--color-bg-surface-raised", 4.5)]),
    content="<p>Show the display name and the full email address. The last item reads “Sign out”.</p>",
    dodont=[(AM, "Keep Sign out last, after a divider.", AM.replace('<hr class="menu-divider">', ""), "Sign out mixed in with destinations is easy to hit by mistake."), (AM, "Say who is signed in.", AM.split('<div class="menu-id">')[0] + '<hr class="menu-divider">' + AM.split('<hr class="menu-divider">')[1], "Without the identity, shared devices are confusing.")],
    tokens=[("Background", "--color-bg-surface-raised"), ("Avatar", "--color-accent"), ("Layer", "--z-menu")], classes=[("menu-scrim", "Outside-click catcher"), ("menu-panel / menu-panel--account", "Panel"), ("menu-id", "Identity"), ("mi", "Item"), ("menu-divider", "Separator")], sources=["dialogs/account-menu/default"]))

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

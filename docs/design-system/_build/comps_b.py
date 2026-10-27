"""Component specs: navigation and containers/overlays."""
from comps_a import IC, B, field_html

SPECS = []
HOME, COMP, LIB, BELL = IC('<path d="M3 12 12 3l9 9M5 10v10h14V10"/>'), IC('<circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5z"/>'), IC('<path d="M5 4v16M10 4v16M15 6l4 14"/>'), IC('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20a2 2 0 0 0 4 0"/>')
LOGO = '<img class="brand-logo brand-logo--light" src="../../mocks/assets/brand/hummi-wordmark-coral.svg" alt="Hummi"><img class="brand-logo brand-logo--dark" src="../../mocks/assets/brand/hummi-wordmark-cream.svg" alt="" aria-hidden="true">'

TOPBAR = ('<header class="topbar"><button class="btn btn--ghost btn--icon topbar__menu" type="button" aria-label="Open navigation" aria-expanded="false">' + IC('<path d="M4 7h16M4 12h16M4 17h16"/>') +
          '</button><form class="search" role="search"><label class="visually-hidden" for="ds-top-q">Search tracks, artists and playlists</label>' + IC('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') +
          '<input class="input" id="ds-top-q" type="search" placeholder="Search tracks, artists, playlists"></form><span class="topbar__spacer"></span><a class="btn btn--ghost btn--icon" href="#code" aria-label="Notifications, 3 unread">' + BELL + '</a><a class="avatar avatar--sm" href="#code" aria-label="Account: Priya Natarajan">PN</a></header>')
SPECS.append(dict(
    slug="top-bar", name="Top bar", group="Navigation", lead="The sticky header: navigation menu on small screens, search, notifications and account.",
    overview="Every signed-in page has one top bar. It holds global actions only; page-specific actions live in the page header.",
    parts=[("Menu button", "Visible under 1024px; toggles the sidebar"), ("Search", "Always available; grows to fill free space"), ("Actions", "Notifications and account, at the end")],
    figure=TOPBAR, variants=[("Signed in", TOPBAR), ("Signed out", '<header class="topbar"><span class="topbar__spacer"></span><a class="btn" href="#code">Sign in</a><a class="btn btn--primary" href="#code">Sign up</a></header>')],
    sizes=None, sizes_na="The bar is a fixed 56px tall.",
    states=dict(rows=[("Menu button", '<button class="btn btn--ghost btn--icon" type="button" aria-label="Open navigation" aria-expanded="false"{a}>' + IC('<path d="M4 7h16M4 12h16M4 17h16"/>') + "</button>")], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Under 1024px the menu button shows and the sidebar collapses behind it; the search field takes all free space. At 1024px and above the sidebar is permanent and the menu button hides.",
    a11y=dict(role="<code>&lt;header&gt;</code> landmark; the search form is <code>role=\"search\"</code>.", keys=[("Tab", "Menu, search, notifications, account"), ("/", "Focuses search (shortcut)")], focus="Standard ring; the skip link is the first focusable element.", label="Icon buttons carry <code>aria-label</code>; the bell announces its unread count.", pairs=[("Text on bar", "--color-fg-default", "--color-bg-surface", 4.5)]),
    content="<p>Search placeholder lists what can be found: “Search tracks, artists, playlists”.</p>",
    dodont=[(TOPBAR, "Global actions only.", '<header class="topbar"><button class="btn btn--primary" type="button">Create playlist</button><span class="topbar__spacer"></span></header>', "Page actions belong in the page header."), ('<header class="topbar"><span class="topbar__spacer"></span><a class="avatar avatar--sm" href="#code" aria-label="Account: Priya Natarajan">PN</a></header>', "Avatar labelled with the account name.", '<header class="topbar"><span class="topbar__spacer"></span><a class="avatar avatar--sm" href="#code" aria-label="Avatar">PN</a></header>', "A generic name tells nobody anything.")],
    tokens=[("Background", "--color-bg-surface"), ("Border", "--color-border-default"), ("Height", "--layout-topbar-height"), ("Layer", "--z-sticky")], classes=[("topbar", "Header container"), ("topbar__menu", "Mobile menu button"), ("topbar__spacer", "Pushes actions to the end")], sources=["pages/home/default", "pages/home/offline", "pages/library/signed-out"]))

NAVLINKS = f'<nav class="sidebar" style="display:flex;position:static;height:auto" aria-label="Example primary"><a class="nav-link" href="#code" aria-current="page">{HOME}Home</a><a class="nav-link" href="#code">{COMP}Browse</a><a class="nav-link" href="#code">{LIB}Library</a><a class="nav-link" href="#code">{BELL}Notifications <span class="badge badge--count" aria-label="3 unread">3</span></a><div class="sidebar__group">Account</div><a class="nav-link" href="#code">Settings</a></nav>'
SPECS.append(dict(
    slug="sidebar-nav", name="Sidebar navigation", group="Navigation", lead="The permanent primary navigation on wide screens and a slide-in on small ones.",
    overview="Lists the five top-level destinations. The current one is marked with <code>aria-current=\"page\"</code>; groups are labelled.",
    parts=[("Logo", "Links home"), ("Nav link", "44px tall, icon and label, optional count"), ("Group label", "Overline text"), ("Current marker", "Subtle accent background")],
    figure=NAVLINKS, variants=[("With badge and group", NAVLINKS)], sizes=None, sizes_na="Width is the <code>--layout-sidebar-width</code> token.",
    states=dict(rows=[("Link", '<a class="nav-link" href="#code"{a}>Browse</a>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Current", ' aria-current="page"')]),
    responsive="At 1024px and above it is a sticky 256px column. Below, it is hidden until the menu button opens it as a full-height panel over the page.",
    a11y=dict(role="<code>&lt;nav aria-label=\"Primary\"&gt;</code> with a flat list of links.", keys=[("Tab", "Moves between links"), ("Enter", "Follows the link"), ("Esc", "Closes the mobile panel")], focus="Standard ring; opening the mobile panel moves focus to its first link.", label="Current page uses <code>aria-current=\"page\"</code>; badge counts have a spoken meaning.", pairs=[("Current link", "--color-fg-accent", "--color-accent-subtle", 4.5), ("Link", "--color-fg-muted", "--color-bg-surface", 4.5)]),
    content="<p>One-word labels: Home, Browse, Search, Library, Notifications.</p>",
    dodont=[(NAVLINKS, "One current link at a time.", NAVLINKS.replace('<a class="nav-link" href="#code">' + COMP + "Browse", '<a class="nav-link" href="#code" aria-current="page">' + COMP + "Browse"), "Two current links."), ('<a class="nav-link" href="#code">Library <span class="badge badge--count" aria-label="2 new">2</span></a>', "Count with a spoken meaning.", '<a class="nav-link" href="#code">Library <span class="badge badge--count">2</span></a>', "A bare number says nothing to a screen reader.")],
    tokens=[("Current background", "--color-accent-subtle"), ("Current text", "--color-fg-accent"), ("Width", "--layout-sidebar-width"), ("Border", "--color-border-default")], classes=[("sidebar", "Container; hidden under 1024px unless <code>data-open=\"true\"</code>"), ("nav-link", "Link row"), ("sidebar__group", "Group label")], sources=["pages/home/default", "pages/settings/default"]))

TABS = '<div class="tabs" role="tablist" aria-label="Library"><button class="tab" role="tab" aria-selected="true" type="button">Playlists</button><button class="tab" role="tab" aria-selected="false" tabindex="-1" type="button">Liked <span class="badge">41</span></button><button class="tab" role="tab" aria-selected="false" tabindex="-1" type="button">Following</button></div>'
SPECS.append(dict(
    slug="tabs", name="Tabs", group="Navigation", lead="Switch between related views of the same content without leaving the page.",
    overview="Use tabs for peers such as Playlists, Liked and Following. If each view has its own URL and heavy content, use sub-pages instead.",
    parts=[("Tab list", "Underlined row, scrolls on small screens"), ("Tab", "44px tall; selected has an accent underline"), ("Count (optional)", "Badge inside the tab")],
    variants=[("Underline with count", TABS)], sizes=None, sizes_na="Tabs are 44px tall.",
    states=dict(rows=[("Tab", '<div class="tabs" role="tablist" aria-label="Example"><button class="tab" role="tab" aria-selected="false" type="button"{a}>Following</button></div>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Selected", ' aria-selected="true"'), ("Disabled", " disabled")]),
    responsive="The tab list scrolls horizontally when it overflows; no wrapping, no truncation.",
    a11y=dict(role="WAI-ARIA Tabs: <code>tablist</code>, <code>tab</code>, <code>tabpanel</code>. Activation is automatic on arrow keys.", keys=[("← →", "Moves to and activates the previous or next tab"), ("Home / End", "First or last tab"), ("Tab", "Moves into the panel from the selected tab")], focus="Only the selected tab is in the tab order (<code>tabindex=\"-1\"</code> on the rest).", label="List has <code>aria-label</code>; each panel is labelled by its tab.", pairs=[("Selected", "--color-fg-accent", "--color-bg-canvas", 4.5), ("Unselected", "--color-fg-muted", "--color-bg-canvas", 4.5)]),
    content="<p>One-word labels in sentence case; counts only when they help decisions.</p>",
    dodont=[(TABS, "Short peer labels.", '<div class="tabs" role="tablist" aria-label="Bad"><button class="tab" role="tab" aria-selected="true" type="button">Everything you have saved in your library</button></div>', "Long tab labels scroll away."), (TABS, "Counts that are true.", TABS.replace("41", "0"), "A zero count adds noise.")],
    tokens=[("Selected underline", "--color-accent"), ("Selected text", "--color-fg-accent"), ("Text", "--color-fg-muted"), ("Baseline", "--color-border-default")], classes=[("tabs", "Container"), ("tab", "Tab button; <code>aria-selected</code> marks the current one")], sources=["pages/library/default", "pages/search/default"]))

BC = '<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="#code">Browse</a></li><li><a href="#code">Ambient</a></li><li aria-current="page">Slow Orbit</li></ol></nav>'
SPECS.append(dict(
    slug="breadcrumb", name="Breadcrumb", group="Navigation", lead="Shows where a page sits in the hierarchy and links back up.",
    overview="Use on pages two or more levels below a top-level destination. Skip it on top-level pages.",
    parts=[("Link", "Ancestor pages"), ("Separator", "Drawn by CSS, hidden from screen readers"), ("Current", "Plain text, <code>aria-current=\"page\"</code>")],
    variants=[("Default", BC)], sizes=None, sizes_na="Inherits text size.",
    states=dict(rows=[("Link", '<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="#code"{a}>Browse</a></li><li aria-current="page">Ambient</li></ol></nav>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="On narrow screens only the parent link and current page show; earlier levels collapse into “…”.",
    a11y=dict(role="<code>&lt;nav aria-label=\"Breadcrumb\"&gt;</code> with an ordered list.", keys=[("Tab", "Moves through the links")], focus="Standard ring.", label="Current item uses <code>aria-current=\"page\"</code>.", pairs=[("Link", "--color-fg-link", "--color-bg-canvas", 4.5)]),
    content="<p>Use page titles exactly. Truncate with an ellipsis only past 24 characters.</p>",
    dodont=[(BC, "Ancestors link, current is plain.", BC.replace('<li aria-current="page">Slow Orbit</li>', '<li><a href="#code">Slow Orbit</a></li>'), "Linking the current page."), ('<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="#code">Browse</a></li><li aria-current="page">Ambient</li></ol></nav>', "Use on nested pages.", '<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li aria-current="page">Home</li></ol></nav>', "A single crumb is not a trail.")],
    tokens=[("Link", "--color-fg-link"), ("Separator", "--color-fg-subtle")], classes=[("breadcrumb", "Ordered list with separators")], sources=["pages/genre/default"]))

PAG = '<nav class="cluster cluster--between" aria-label="Pagination"><span class="text-caption">Showing 1–20 of 38</span><ul class="pagination"><li><a href="#code" aria-disabled="true" aria-label="Previous page">‹</a></li><li><a href="#code" aria-current="page">1</a></li><li><a href="#code">2</a></li><li><a href="#code" aria-label="Next page">›</a></li></ul></nav>'
SPECS.append(dict(
    slug="pagination", name="Pagination", group="Navigation", lead="Moves through long result sets one page at a time.",
    overview="Use for result lists that people may share or return to. For feeds, use “Load more”.",
    parts=[("Summary", "Which items are showing"), ("Page link", "Number; current has <code>aria-current</code>"), ("Previous / Next", "Arrow links with labels")],
    variants=[("Numbered", PAG)], sizes=None, sizes_na="Fixed 40px targets.",
    states=dict(rows=[("Page", '<ul class="pagination"><li><a href="#code"{a}>2</a></li></ul>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Current", ' aria-current="page"')]),
    responsive="Under 640px only Previous, the current page and Next remain.",
    a11y=dict(role="<code>&lt;nav aria-label=\"Pagination\"&gt;</code> with links.", keys=[("Tab", "Moves between links")], focus="Standard ring.", label="Previous and Next have <code>aria-label</code>; disabled ends use <code>aria-disabled</code>.", pairs=[("Current page", "--color-fg-on-accent", "--color-accent", 4.5)]),
    content="<p>Say “Showing 1–20 of 38”. Never “Page 1 of ?”.</p>",
    dodont=[(PAG, "Show the range and total.", '<nav aria-label="Pagination"><ul class="pagination"><li><a href="#code" aria-current="page">1</a></li><li><a href="#code">2</a></li></ul></nav>', "No sense of how much remains."), (PAG, "Labelled arrows.", PAG.replace(' aria-label="Next page"', ""), "An unnamed link announces only “›”.")],
    tokens=[("Current background", "--color-accent"), ("Current text", "--color-fg-on-accent"), ("Border", "--color-border-default")], classes=[("pagination", "Link list"), ("aria-current=\"page\"", "Current page")], sources=["pages/genre/default"]))

SPECS.append(dict(
    slug="skip-link", name="Skip link", group="Navigation", lead="The first focusable element on every page; jumps keyboard users past the navigation.",
    overview="Visible only when focused. It targets <code>#main</code>.",
    parts=[("Link", "Positioned off-screen until focused"), ("Focus state", "Raised pill with the focus ring")],
    variants=[("Focused", '<a class="skip-link" href="#main" data-state="focus" style="position:static">Skip to content</a>')], sizes=None, sizes_na="Single size.",
    states=dict(rows=[("Skip link", '<a class="skip-link" href="#main"{a} style="position:static">Skip to content</a>')], cols=[("Focused", ' data-state="focus"')]),
    responsive="Same at every width.",
    a11y=dict(role="A normal link to the <code>main</code> landmark.", keys=[("Tab", "First stop on the page, shows the link"), ("Enter", "Moves focus to main")], focus="Appears at the top left with the standard ring.", label="Text is “Skip to content”.", pairs=[("Text", "--color-fg-default", "--color-bg-surface-raised", 4.5)]),
    content="<p>Always “Skip to content”.</p>",
    dodont=[('<a class="skip-link" href="#main" data-state="focus" style="position:static">Skip to content</a>', "Standard wording.", '<a class="skip-link" href="#main" data-state="focus" style="position:static">Go</a>', "Unclear destination."), ('<a class="skip-link" href="#main" data-state="focus" style="position:static">Skip to content</a>', "Links to #main.", '<a class="skip-link" href="#top" data-state="focus" style="position:static">Skip to content</a>', "A link to the top skips nothing.")],
    tokens=[("Background", "--color-bg-surface-raised"), ("Shadow", "--shadow-3"), ("Layer", "--z-tooltip")], classes=[("skip-link", "Hidden until focused")], sources=["pages/home/default"]))

# ---------------------------------------------------------------- containers
CARD = '<div class="card"><div class="card__header"><h3 class="card__title">Late-night coding</h3></div><p class="text-muted">24 tracks · 1 h 32 min</p><div class="card__footer"><button class="btn btn--primary" type="button">Play</button></div></div>'
SPECS.append(dict(
    slug="card", name="Card", group="Containers", lead="A bordered surface that groups related content.",
    overview="Use cards for self-contained groups such as settings sections. For lists of media, use the media tile instead.",
    parts=[("Container", "Surface with border, <code>--radius-lg</code>"), ("Header", "Title, optional actions"), ("Body", "Content"), ("Footer", "Actions")],
    variants=[("Default", CARD), ("Interactive", '<a class="card card--interactive" href="#code" style="display:block;text-decoration:none;color:inherit"><h3 class="card__title">Open settings</h3><p class="text-muted">Profile, playback and appearance</p></a>'), ("Selected", '<div class="card card--selected"><h3 class="card__title">Public playlist</h3></div>')],
    sizes=None, sizes_na="Cards fit their container; padding is 24px.",
    states=dict(rows=[("Interactive", '<a class="card card--interactive" href="#code"{a} style="display:block;text-decoration:none;color:inherit">Open settings</a>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Padding drops to 16px under 640px; cards stack in a single column.",
    a11y=dict(role="A card is a container. An interactive card has exactly one link or button covering it; do not nest controls.", keys=[("Tab", "Reaches the card’s link or button")], focus="Ring around the whole card when it is a link.", label="The heading names the card; the link text is that heading.", pairs=[("Text on card", "--color-fg-default", "--color-bg-surface", 4.5)]),
    content="<p>Card titles are nouns in sentence case.</p>",
    dodont=[(CARD, "One clear action in the footer.", CARD.replace("</div></div>", '<button class="btn" type="button">A</button><button class="btn" type="button">B</button><button class="btn" type="button">C</button></div></div>', 1), "Many actions crowd the footer."), ('<div class="card"><p>One idea.</p></div>', "A single grouped idea.", '<div class="card"><div class="card"><p>Nested</p></div></div>', "Cards inside cards.")],
    tokens=[("Background", "--color-bg-surface"), ("Border", "--color-border-default"), ("Radius", "--radius-lg"), ("Shadow", "--shadow-1"), ("Padding", "--space-6")], classes=[("card", "Surface"), ("card--interactive", "Hover raise; use with a link"), ("card--selected", "Accent border")], sources=["pages/settings/default", "pages/sign-in/default"]))

SPECS.append(dict(
    slug="dialog", name="Dialog", group="Containers", lead="A modal that asks for a decision or a short form; a bottom sheet on phones.",
    overview="Use for a decision or a task that needs full attention and is quick. For long tasks use a page. Destructive dialogs name the object and use a danger button.",
    parts=[("Backdrop", "Dims and blocks the page, which is <code>inert</code>"), ("Header", "Icon, title (h2), description, close button"), ("Body", "Fields or content"), ("Footer", "Cancel then primary")],
    figure='<div class="dialog__panel" style="position:static;max-width:24rem"><div class="dialog__header"><div style="flex:1"><h3 class="dialog__title">Sign out of Hummi?</h3></div></div><div class="dialog__footer"><button class="btn" type="button">Cancel</button><button class="btn btn--primary" type="button">Sign out</button></div></div>',
    variants=[("Confirmation", '<div class="dialog__panel" style="position:static;max-width:28rem"><div class="dialog__header"><div class="dialog__icon dialog__icon--info" aria-hidden="true">' + IC('<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>') + '</div><div style="flex:1"><h3 class="dialog__title">Sign out of Hummi?</h3><p class="text-muted">Your playlists and likes stay saved.</p></div></div><div class="dialog__footer"><button class="btn" type="button">Cancel</button><button class="btn btn--primary" type="button">Sign out</button></div></div>'),
              ("Destructive", '<div class="dialog__panel" style="position:static;max-width:28rem"><div class="dialog__header"><div class="dialog__icon dialog__icon--danger" aria-hidden="true">' + IC('<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>') + '</div><div style="flex:1"><h3 class="dialog__title">Delete “Late-night coding”?</h3><p class="text-muted">You can’t undo this.</p></div></div><div class="dialog__footer"><button class="btn" type="button">Cancel</button><button class="btn btn--danger" type="button">Delete playlist</button></div></div>')],
    variants_note="In the product the panel is centred in a fixed <code>.dialog</code> over a <code>.backdrop</code>; here it is shown in flow.",
    sizes=[("Default (32rem)", '<div class="dialog__panel" style="position:static;max-width:20rem"><div class="dialog__header"><h3 class="dialog__title">Default width</h3></div></div>'), ("Large (<code>dialog__panel--lg</code>)", '<div class="dialog__panel dialog__panel--lg" style="position:static"><div class="dialog__header"><h3 class="dialog__title">Large width</h3></div></div>')],
    states=dict(rows=[("Footer", '<div class="dialog__footer"><button class="btn" type="button"{a}>Cancel</button><button class="btn btn--primary" type="button" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>Saving…</button></div>')], cols=[("Busy", ""), ("Cancel focus", ' data-state="focus"')],
                extra='<p>Other states in the mocks: <a href="../../mocks/dialogs/create-playlist/invalid.html">invalid</a>, <a href="../../mocks/dialogs/create-playlist/busy.html">busy</a>, <a href="../../mocks/dialogs/create-playlist/failed.html">failed</a>.</p>'),
    responsive="Under 640px the panel is a full-width bottom sheet with rounded top corners; footer buttons stay side by side.",
    a11y=dict(role="WAI-ARIA Dialog (modal): <code>role=\"dialog\" aria-modal=\"true\"</code> with <code>aria-labelledby</code> and <code>aria-describedby</code>. The page behind is <code>inert</code>.", keys=[("Tab / Shift+Tab", "Cycles inside the dialog"), ("Esc", "Closes (unless a request is running)"), ("Enter", "Activates the focused button")], focus="Focus starts on the first field or the safe button and returns to the trigger on close.", label="Title names the dialog; description explains the consequence.", pairs=[("Text", "--color-fg-default", "--color-bg-surface-raised", 4.5), ("Muted text", "--color-fg-muted", "--color-bg-surface-raised", 4.5)],
              motion="Slides up in <code>--duration-slow</code>; fade only under reduced-motion."),
    content="<p>Title is a question or a verb phrase that names the object. Buttons repeat the verb: “Delete playlist”, not “OK”.</p>",
    dodont=[("<p>Delete “Late-night coding”?</p>" + B("btn--danger", "Delete playlist"), "Name the object and the verb.", "<p>Are you sure?</p>" + B("btn--danger", "OK"), "Unspecific question and answer."), ("<p>Sign out?</p>" + B("", "Cancel") + " " + B("btn--primary", "Sign out"), "Cancel first, action last.", "<p>Sign out?</p>" + B("btn--primary", "Sign out") + " " + B("", "Cancel"), "Reversed order breaks the pattern.")],
    tokens=[("Panel", "--color-bg-surface-raised"), ("Shadow", "--shadow-4"), ("Radius", "--radius-xl"), ("Backdrop", "--color-bg-backdrop"), ("Layer", "--z-modal")], classes=[("dialog", "Fixed overlay, centres the panel"), ("dialog__panel", "The surface"), ("dialog__header / __body / __footer", "Regions"), ("backdrop", "Dimming layer")], sources=["dialogs/create-playlist/default", "dialogs/delete-playlist/confirm", "dialogs/sign-out/default"]))

SPECS.append(dict(
    slug="tooltip", name="Tooltip", group="Containers", lead="A short label that appears on hover and focus.",
    overview="Use a tooltip to name an icon-only control or give a one-line hint. Never put interactive content or essential information in one.",
    parts=[("Trigger", "Any focusable element"), ("Bubble", "Inverse surface, <code>role=\"tooltip\"</code>")],
    variants=[("On an icon button", '<button class="btn btn--ghost btn--icon has-tooltip" type="button" aria-label="Queue">' + IC('<path d="M4 6h12M4 11h12M4 16h7M17 14v6l5-3z"/>') + '<span class="tooltip" role="tooltip">Queue</span></button>')],
    sizes=None, sizes_na="One size.", states=dict(rows=[("Trigger", '<button class="btn btn--ghost btn--icon has-tooltip" type="button" aria-label="Queue"{a}>' + IC('<path d="M4 6h12M4 11h12M4 16h7M17 14v6l5-3z"/>') + '<span class="tooltip" role="tooltip">Queue</span></button>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Hidden on touch-only devices; the control’s <code>aria-label</code> is the real name.",
    a11y=dict(role="<code>role=\"tooltip\"</code>, referenced by <code>aria-describedby</code> on the trigger.", keys=[("Focus", "Shows the tooltip"), ("Esc", "Hides it")], focus="Shows on keyboard focus as well as hover.", label="Repeats or adds to the accessible name; never replaces it.", pairs=[("Text", "--color-fg-inverse", "--color-bg-inverse", 4.5)], motion="Fades in after 300ms, out instantly."),
    content="<p>One to four words, no full stop.</p>",
    dodont=[('<button class="btn btn--ghost btn--icon has-tooltip" type="button" aria-label="Queue">' + IC('<path d="M4 6h12"/>') + '<span class="tooltip" role="tooltip">Queue</span></button>', "Names an icon.", B("btn--ghost", "Pay now") + " (with a tooltip carrying the price)", "Essential information hidden in a tooltip."), (B("", "Share"), "Visible labels need no tooltip.", B("", "Share") + " (with a tooltip repeating “Share”)", "A tooltip that repeats the label.")],
    tokens=[("Background", "--color-bg-inverse"), ("Text", "--color-fg-inverse"), ("Layer", "--z-tooltip"), ("Radius", "--radius-sm")], classes=[("has-tooltip", "Trigger wrapper"), ("tooltip", "Bubble")], sources=["pages/home/default"]))

SPECS.append(dict(
    slug="divider", name="Divider", group="Containers", lead="A thin rule that separates groups.",
    overview="Use a divider between unrelated groups inside one surface. Prefer spacing when groups are already clear.",
    parts=[("Line", "1px in <code>--color-border-default</code>")],
    variants=[("Horizontal", '<p>Above</p><hr class="divider"><p>Below</p>'), ("In a menu", '<div class="menu" role="menu" aria-label="Divider example"><button class="menu__item" role="menuitem" type="button">Add to queue</button><div class="menu__divider" role="separator"></div><button class="menu__item" role="menuitem" type="button">Report</button></div>')],
    sizes=None, sizes_na="Always 1px.", states=None,
    responsive="Full width of the container at every breakpoint.", a11y=dict(role="<code>&lt;hr&gt;</code> or <code>role=\"separator\"</code>.", keys=[("n/a", "Not focusable")], focus="Not focusable.", label="Decorative; hidden from assistive tech when purely visual.", pairs=[]),
    content="<p>Dividers carry no text.</p>",
    dodont=[('<p>Settings</p><hr class="divider"><p>Danger zone</p>', "Separates unrelated groups.", '<hr class="divider"><p>Item</p><hr class="divider"><p>Item</p><hr class="divider">', "A rule between every item."), ('<p>One</p><hr class="divider"><p>Two</p>', "A single rule.", '<hr class="divider"><hr class="divider">', "Stacked rules.")],
    tokens=[("Line", "--color-border-default"), ("Margin", "--space-6")], classes=[("divider / hr", "Horizontal rule"), ("menu__divider", "Rule inside menus")], sources=["pages/track/default"]))

SPECS.append(dict(
    slug="layout", name="Layout primitives", group="Containers", lead="Container, grid, stack and cluster: the building blocks every page template uses.",
    overview="Pages are built from four primitives. Use <code>container</code> for width and margins, <code>grid</code> for columns, <code>stack</code> for vertical rhythm and <code>cluster</code> for rows that wrap.",
    parts=[("Container", "Max width with responsive margins"), ("Grid", "4, 8 or 12 columns with responsive gutters"), ("Stack", "Vertical flow with a gap"), ("Cluster", "Horizontal flow that wraps")],
    variants=[("Stack", '<div class="stack"><div class="card">One</div><div class="card">Two</div></div>'), ("Cluster", '<div class="cluster"><button class="btn" type="button">One</button><button class="btn" type="button">Two</button><button class="btn" type="button">Three</button></div>'), ("Auto grid", '<div class="grid grid--auto"><div class="card">A</div><div class="card">B</div><div class="card">C</div></div>')],
    sizes=None, sizes_na="Sizes come from layout tokens.", states=None,
    responsive="Columns are 4/8/12, gutters 16/24/32px and margins 16/32/48px at 0/768/1024px. See the Layout foundation for the live grid.",
    a11y=dict(role="Presentational wrappers; semantics come from their content.", keys=[("n/a", "Not interactive")], focus="Reading order equals DOM order; never reorder visually in a way that changes meaning.", label="Landmarks are applied on the elements inside.", pairs=[]),
    content="<p>No text content.</p>",
    dodont=[('<div class="stack"><p>Line</p><p>Line</p></div>', "Use stack for rhythm.", '<p>Line</p><br><br><p>Line</p>', "Breaks as spacing."), ('<div class="cluster"><span class="chip">A</span><span class="chip">B</span></div>', "Cluster wraps.", '<div style="white-space:nowrap"><span class="chip">A</span><span class="chip">B</span></div>', "No-wrap rows overflow on phones.")],
    tokens=[("Gutter", "--layout-gutter"), ("Margin", "--layout-margin"), ("Columns", "--layout-columns"), ("Container max", "--layout-container-max")], classes=[("container / container--narrow", "Width and margins"), ("grid / grid--auto", "Columns"), ("stack / stack--sm / --lg", "Vertical gap"), ("cluster / cluster--between / --end", "Wrapping row")], sources=["pages/home/default", "pages/settings/default"]))

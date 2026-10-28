"""Component specs: data display and feedback."""
from comps_a import IC, B

SPECS = []
X = IC('<path d="M6 6l12 12M18 6 6 18"/>')

TBL = ('<div class="table-wrap"><table class="table"><caption class="visually-hidden">Licences used on Hummi</caption><thead><tr><th scope="col">Licence</th><th scope="col">You may</th><th scope="col">You must</th></tr></thead><tbody>'
       '<tr><th scope="row">CC0 1.0</th><td>Use for any purpose</td><td>Nothing</td></tr><tr><th scope="row">CC BY 4.0</th><td>Use, remix, share</td><td>Credit the artist</td></tr></tbody></table></div>')
SPECS.append(dict(
    slug="table", name="Table", group="Data display", lead="Compares records across columns. Scrolls inside its own wrapper on small screens.",
    overview="Use a table when people compare values across rows. For a list of media or a feed, use list or track row instead.",
    parts=[("Caption", "Visually hidden name of the table"), ("Header cells", "<code>th scope=\"col\"</code>"), ("Row header", "<code>th scope=\"row\"</code> for the identifying cell"), ("Wrapper", "<code>table-wrap</code> scrolls horizontally")],
    variants=[("Default", TBL)], sizes=None, sizes_na="Density is one size in Hummi; add a compact modifier when a data-heavy page needs it.",
    states=dict(rows=[("Row", '<div class="table-wrap"><table class="table"><caption class="visually-hidden">Example</caption><thead><tr><th scope="col">Licence</th></tr></thead><tbody><tr{a}><th scope="row">CC0 1.0</th></tr></tbody></table></div>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Selected", ' aria-selected="true"')]),
    responsive="The wrapper scrolls horizontally; the page never does. First column stays readable by being the row header.",
    a11y=dict(role="Native table with caption and header scopes. Sortable headers use <code>aria-sort</code>.", keys=[("Tab", "Reaches controls inside cells")], focus="Interactive cells use the standard ring.", label="Caption names the table; headers describe columns.", pairs=[("Cell text", "--color-fg-default", "--color-bg-surface", 4.5), ("Header text", "--color-fg-muted", "--color-bg-surface-sunken", 4.5)]),
    content="<p>Column headers are nouns; numbers are right-aligned with tabular figures.</p>",
    dodont=[(TBL, "Caption and header scopes.", '<div class="table-wrap"><table class="table"><tbody><tr><td>CC0</td><td>Anything</td></tr></tbody></table></div>', "No headers or caption."), (TBL, "Wrapper handles overflow.", "<table class=\"table\"><caption class=\"visually-hidden\">Wide</caption><tbody><tr><td>CC0</td></tr></tbody></table>", "No wrapper means page scroll.")],
    tokens=[("Header background", "--color-bg-surface-sunken"), ("Row hover", "--color-bg-subtle"), ("Border", "--color-border-default")], classes=[("table-wrap", "Scroll container"), ("table", "Table styling")], sources=["pages/licence/default"]))

LIST = '<ul class="list" style="list-style:none;padding:0"><li class="list__item"><div class="list__body"><div class="list__title">Late-night coding</div><div class="list__meta">24 tracks</div></div></li><li class="list__item"><div class="list__body"><div class="list__title">Rain on the window</div><div class="list__meta">18 tracks</div></div></li></ul>'
SPECS.append(dict(
    slug="list", name="List", group="Data display", lead="A vertical list of rows with a title, meta line and optional actions.",
    overview="Use for short collections where each row is an item. For tracks use the track row.",
    parts=[("Row", "Padded, divided"), ("Title", "Primary text"), ("Meta", "Secondary text")],
    variants=[("Two-line", LIST), ("Interactive", '<ul class="list" style="list-style:none;padding:0"><li class="list__item list__item--interactive"><a class="list__body" href="#code" style="color:inherit;text-decoration:none"><div class="list__title">Sunday kitchen</div><div class="list__meta">31 tracks · Mei Rodríguez</div></a></li></ul>')],
    sizes=None, sizes_na="Row height follows content.", states=dict(rows=[("Row", '<ul class="list" style="list-style:none;padding:0"><li class="list__item list__item--interactive"{a}><div class="list__body"><div class="list__title">Row</div></div></li></ul>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Selected", ' aria-selected="true"')]),
    responsive="Rows keep full width; meta wraps under the title.",
    a11y=dict(role="<code>&lt;ul&gt;</code> of items; interactive rows contain a link or button.", keys=[("Tab", "Moves to row controls")], focus="Ring on the link inside the row.", label="Each row’s title is its name.", pairs=[("Title", "--color-fg-default", "--color-bg-surface", 4.5), ("Meta", "--color-fg-muted", "--color-bg-surface", 4.5)]),
    content="<p>Title is the item name; meta adds counts or owner.</p>",
    dodont=[(LIST, "Title plus one meta line.", LIST.replace('<div class="list__meta">24 tracks</div>', '<div class="list__meta">24 tracks · private · created 14 Oct 2026 · edited yesterday · 1 h 32 min</div>'), "Meta that wraps to many lines."), (LIST, "Real list markup.", '<div class="list__item">Late-night coding</div>', "Divs without list semantics.")],
    tokens=[("Divider", "--color-border-default"), ("Hover", "--color-bg-subtle"), ("Title", "--color-fg-default"), ("Meta", "--color-fg-muted")], classes=[("list / list__item / list__body", "Structure"), ("list__title / list__meta", "Text"), ("list__item--interactive", "Hover and focus")], sources=["pages/notifications/default"]))

DL = '<dl class="dl"><dt>Artist</dt><dd><a href="#code">Lumen Fox</a></dd><dt>Genre</dt><dd>Ambient</dd><dt>Licence</dt><dd>CC0 1.0 (public domain)</dd></dl>'
DL_EXTERNAL = '<dl class="dl"><dt>Source</dt><dd><a href="https://pixabay.com/music/" target="_blank" rel="noopener noreferrer" aria-label="Pixabay (opens in a new tab)">Pixabay</a></dd><dt>Licence</dt><dd><a href="#code">Pixabay Content License</a></dd></dl>'
SPECS.append(dict(
    slug="description-list", name="Description list", group="Data display", lead="Key and value pairs for facts about one thing.",
    overview="Use for details such as a track’s artist, genre and licence.",
    parts=[("Term", "Muted label"), ("Description", "The value")],
    variants=[("Default", DL), ("External link", DL_EXTERNAL)], sizes=None, sizes_na="Inherits text size.", states=None,
    responsive="Terms sit beside values from 768px; stacked above values on phones.",
    a11y=dict(role="Native <code>&lt;dl&gt;</code>.", keys=[("n/a", "Not interactive; links inside are tab stops")], focus="Standard ring on links.", label="Terms name their values; an external link opens in a new tab and its accessible name says so.", pairs=[("Term", "--color-fg-muted", "--color-bg-canvas", 4.5)]),
    content="<p>Terms are nouns without colons. A value that leads off Hummi, such as a track’s Source on Pixabay, is an external link: <code>href</code> instead of an in-app route, opening in a new tab with <code>rel=\"noopener noreferrer\"</code>. In Angular an item is <code>{ term, value, link? }</code> for an in-app route or <code>{ term, value, href? }</code> for an external page.</p>",
    dodont=[(DL, "Short noun terms.", DL.replace("<dt>Artist</dt>", "<dt>Who made this track:</dt>"), "Long terms with colons."), (DL, "Real dl markup.", "<p>Artist: Lumen Fox</p><p>Genre: Ambient</p>", "Paragraphs lose the pairing.")],
    tokens=[("Term text", "--color-fg-muted"), ("Gap", "--space-2")], classes=[("dl", "Grid of terms and descriptions")], sources=["pages/track/default"]))

AV = '<span class="avatar" aria-hidden="true">PN</span> <span class="avatar avatar--sm" aria-hidden="true">JA</span>'
SPECS.append(dict(
    slug="avatar", name="Avatar", group="Data display", lead="A circle with initials identifying a person.",
    overview="Use next to a name. When it stands alone it is a labelled link or button.",
    parts=[("Circle", "Round, accent-subtle background"), ("Initials", "Two letters")],
    variants=[("Initials", AV), ("As account link", '<a class="avatar avatar--sm" href="#code" aria-label="Account: Priya Natarajan">PN</a>')],
    sizes=[("Small", '<span class="avatar avatar--sm" aria-hidden="true">PN</span>'), ("Default", '<span class="avatar" aria-hidden="true">PN</span>')],
    states=None, responsive="Fixed size at every width.",
    a11y=dict(role="Decorative when beside the name; a link with <code>aria-label</code> otherwise.", keys=[("Tab", "Only when it is a link")], focus="Standard ring when interactive.", label="“Account: Priya Natarajan” when standalone.", pairs=[("Initials", "--color-fg-accent", "--color-accent-subtle", 4.5)]),
    content="<p>Initials come from the display name: first letter of first and last word.</p>",
    dodont=[('<a class="avatar avatar--sm" href="#code" aria-label="Account: Priya Natarajan">PN</a>', "Named when standalone.", '<a class="avatar avatar--sm" href="#code" aria-label="Avatar">PN</a>', "A generic label."), (AV, "Two initials.", '<span class="avatar" aria-hidden="true">PRIYA</span>', "Whole names overflow the circle.")],
    tokens=[("Background", "--color-accent-subtle"), ("Text", "--color-fg-accent"), ("Radius", "--radius-full")], classes=[("avatar / avatar--sm", "Circle sizes")], sources=["pages/home/default", "pages/settings/default"]))

BADGES = '<span class="badge">Neutral</span> <span class="badge badge--info">Info</span> <span class="badge badge--success">On time</span> <span class="badge badge--warning">Due soon</span> <span class="badge badge--danger">Overdue</span> <span class="badge badge--count" aria-label="3 unread">3</span>'
SPECS.append(dict(
    slug="badge", name="Badge", group="Data display", lead="A small label showing status or a count.",
    overview="Badges always carry a dot and a word; counts carry an accessible meaning. Do not use badges as buttons.",
    parts=[("Dot", "Drawn by CSS; second cue beyond colour"), ("Label", "One or two words"), ("Count", "Numeric variant")],
    variants=[("Status and count", BADGES)], sizes=None, sizes_na="One size.", states=None,
    responsive="Badges never wrap or truncate.",
    a11y=dict(role="Plain text; counts use <code>aria-label</code>.", keys=[("n/a", "Not interactive")], focus="Not focusable.", label="“3 unread” rather than “3”.", pairs=[("Info", "--color-info-fg", "--color-info-bg", 4.5), ("Success", "--color-success-fg", "--color-success-bg", 4.5), ("Warning", "--color-warning-fg", "--color-warning-bg", 4.5), ("Danger", "--color-danger-fg", "--color-danger-bg", 4.5)]),
    content="<p>Status words: Draft, Private, Public. Counts cap at 99+.</p>",
    dodont=[('<span class="badge badge--danger">Overdue</span>', "Word plus dot.", '<span class="badge badge--danger"></span>', "Colour alone."), ('<span class="badge badge--count" aria-label="3 unread">3</span>', "Spoken meaning.", '<span class="badge badge--count">3</span>', "A bare number.")],
    tokens=[("Info", "--color-info-bg"), ("Success", "--color-success-bg"), ("Warning", "--color-warning-bg"), ("Danger", "--color-danger-bg"), ("Count", "--color-danger-solid")], classes=[("badge", "Base"), ("badge--info / --success / --warning / --danger", "Tones"), ("badge--count", "Count")], sources=["pages/home/default", "pages/notifications/default"]))

CH = '<button class="chip" type="button" aria-pressed="true">Newest</button> <button class="chip" type="button" aria-pressed="false">Most played</button> <a class="chip" href="#code">Ambient</a>'
SPECS.append(dict(
    slug="chip", name="Chip", group="Data display", lead="A compact toggle or link, used for filters and genres.",
    overview="Use for filters (toggle) or genre shortcuts (link). Removable chips carry a labelled remove button.",
    parts=[("Label", "One or two words"), ("Pressed state", "Accent subtle background")],
    variants=[("Filter and link", CH)], sizes=None, sizes_na="One size, 32px tall.",
    states=dict(rows=[("Filter chip", '<button class="chip" type="button" aria-pressed="false"{a}>Newest</button>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Pressed", ' aria-pressed="true"')]),
    responsive="Rows of chips use <code>pill-row</code> to scroll horizontally on phones.",
    a11y=dict(role="Filter chips are toggle buttons (<code>aria-pressed</code>); genre chips are links.", keys=[("Enter / Space", "Toggles a filter chip")], focus="Standard ring.", label="Visible text names the filter.", pairs=[("Pressed", "--color-fg-accent", "--color-accent-subtle", 4.5)]),
    content="<p>Sentence case, one or two words.</p>",
    dodont=[(CH, "Toggle with aria-pressed.", '<span class="chip">Newest</span>', "A span does nothing for keyboard users."), ('<div class="pill-row" role="list" aria-label="Genres"><a class="chip" role="listitem" href="#code">Ambient</a><a class="chip" role="listitem" href="#code">Lo-fi</a></div>', "Scrolling row on phones.", '<div class="cluster"><a class="chip" href="#code">Ambient</a><a class="chip" href="#code">Lo-fi</a><a class="chip" href="#code">Synthwave</a><a class="chip" href="#code">Jazz</a></div>', "Wrapping rows eat vertical space.")],
    tokens=[("Background", "--color-bg-subtle"), ("Pressed background", "--color-accent-subtle"), ("Radius", "--radius-full")], classes=[("chip", "Base"), ("aria-pressed=\"true\"", "Selected"), ("pill-row", "Scrolling row")], sources=["pages/library/default", "pages/genre/default"]))

# ---------------------------------------------------------------- feedback
def toast(kind, title, text, action=""):
    ic = {"info": '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>', "success": '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', "warning": '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>', "danger": '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>'}[kind]
    a = f'<button class="toast__action" type="button">{action}</button>' if action else ""
    return f'<div class="toast toast--{kind}" style="position:static">{IC(ic)}<div class="toast__body"><div class="toast__title">{title}</div><div class="toast__text">{text}</div>{a}</div><button class="close" type="button" aria-label="Dismiss">{X}</button></div>'


SPECS.append(dict(
    slug="toast", name="Toast", group="Feedback", lead="A transient message about something that just happened.",
    overview="Use for confirmation of a completed action, with Undo when reversible. Errors persist until dismissed. For page-wide state use a banner.",
    parts=[("Icon", "Tone cue beyond colour"), ("Title and text", "What happened and what is next"), ("Action", "Undo, View or Retry"), ("Dismiss", "Labelled close button")],
    variants=[("Success with undo", toast("success", "Added to Late-night coding", "“Slow Orbit” is now track 25.", "Undo")), ("Info", toast("info", "Added to queue", "“Glass Rain” plays after the current track.")), ("Warning", toast("warning", "Already in this playlist", "Add it again?", "Add again")), ("Danger", toast("danger", "Couldn’t add the track", "The connection dropped. Nothing was added.", "Retry"))],
    sizes=None, sizes_na="Width is fixed by the region (max 24rem).",
    states=dict(rows=[("Dismiss", '<button class="close" type="button" aria-label="Dismiss"{a}>' + X + "</button>")], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')], extra="<p>Stacking and dismissal: see <a href=\"../../mocks/notifications/toast/stacked.html\">toast · stacked</a>.</p>"),
    responsive="The region spans the width with a 16px margin on phones and sits bottom-right from 640px. At most three toasts show.",
    a11y=dict(role="Region is <code>role=\"status\" aria-live=\"polite\"</code> and exists before toasts arrive; errors use <code>role=\"alert\"</code>.", keys=[("Tab", "Reaches the action and dismiss button"), ("Esc", "Dismisses the focused toast")], focus="Toasts never steal focus.", label="Dismiss is labelled; actions name the verb.", pairs=[("Text", "--color-fg-inverse", "--color-bg-inverse", 4.5)],
              motion="Slides in and out in <code>--duration-base</code>. Auto-dismiss (8s) pauses on hover and focus; errors never auto-dismiss."),
    content="<p>Title says what happened in the past tense; text says what is next. No exclamation marks.</p>",
    dodont=[(toast("success", "Added to Late-night coding", "“Slow Orbit” is now track 25.", "Undo"), "Specific, with Undo.", toast("success", "Success!", "Operation completed."), "Vague and loud."), (toast("danger", "Couldn’t add the track", "Nothing was added.", "Retry"), "Errors persist and offer a way forward.", toast("danger", "Error", ""), "An error with no explanation.")],
    tokens=[("Background", "--color-bg-inverse"), ("Text", "--color-fg-inverse"), ("Shadow", "--shadow-3"), ("Layer", "--z-toast"), ("Radius", "--radius-md")], classes=[("toast-region", "Live region wrapper"), ("toast / toast--{tone}", "The toast"), ("toast__action", "Inline action"), ("close", "Dismiss button")], sources=["notifications/toast/success", "notifications/toast/stacked", "notifications/toast/danger"]))

def alert(kind, title, text, ic):
    return f'<div class="alert alert--{kind}">{IC(ic)}<div class="alert__body"><div class="alert__title">{title}</div><div>{text}</div></div></div>'


A_INFO, A_OK, A_WARN, A_ERR = '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8v.5"/>', '<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>', '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>', '<path d="M12 4 2.5 20h19zM12 10v4M12 17v.5"/>'
SPECS.append(dict(
    slug="alert", name="Alert and banner", group="Feedback", lead="Inline messages and page-wide banners in four tones.",
    overview="Use an inline alert for state that belongs to a section, a banner for state that applies to the whole page (offline, maintenance, verify email).",
    parts=[("Icon", "Tone cue"), ("Title", "Short statement"), ("Body", "What to do"), ("Actions (optional)", "A link or button")],
    variants=[("Info", alert("info", "This playlist belongs to Mei Rodríguez", "You can listen and save a copy.", A_INFO)), ("Success", alert("success", "Settings saved", "Your changes apply on every device.", A_OK)), ("Warning", alert("warning", "This track is no longer available", "Its creator withdrew it.", A_WARN)), ("Danger", alert("danger", "Playback stopped", "We lost the connection. We’ll resume from 1:24.", A_ERR)),
              ("Banner", '<div class="alert alert--warning banner" role="status">' + IC('<path d="M3 3l18 18M8.5 8.5A11 11 0 0 0 2 11"/>') + '<div class="alert__body"><span><strong>You are offline.</strong> Showing saved tracks.</span></div></div>')],
    sizes=None, sizes_na="Alerts fill their container.", states=None,
    responsive="Banners wrap their text and keep icon alignment; actions drop below the text under 640px.",
    a11y=dict(role="<code>role=\"alert\"</code> only for new, important content; otherwise <code>role=\"status\"</code> or none.", keys=[("Tab", "Reaches any action or dismiss button")], focus="Never moves focus.", label="Tone is stated in words as well as colour.", pairs=[("Info", "--color-info-fg", "--color-info-bg", 4.5), ("Success", "--color-success-fg", "--color-success-bg", 4.5), ("Warning", "--color-warning-fg", "--color-warning-bg", 4.5), ("Danger", "--color-danger-fg", "--color-danger-bg", 4.5)]),
    content="<p>State the fact, then what to do. “We couldn’t save your changes. Try again.”</p>",
    dodont=[(alert("danger", "Playback stopped", "We lost the connection.", A_ERR), "Says what happened.", alert("danger", "Error", "Something went wrong.", A_ERR), "Says nothing useful."), (alert("info", "Heads up", "Read me.", A_INFO), "One alert per concern.", alert("info", "A", "", A_INFO) + alert("info", "B", "", A_INFO) + alert("info", "C", "", A_INFO), "A wall of alerts.")],
    tokens=[("Info background", "--color-info-bg"), ("Success background", "--color-success-bg"), ("Warning background", "--color-warning-bg"), ("Danger background", "--color-danger-bg"), ("Border (info)", "--color-info-border")], classes=[("alert / alert--{tone}", "Inline alert"), ("banner", "Page-wide modifier"), ("alert__title / alert__body", "Parts")], sources=["pages/home/offline", "pages/settings/success", "pages/track/unavailable", "notifications/banner/persistent"]))

SPECS.append(dict(
    slug="inline-message", name="Inline message", group="Feedback", lead="Hint, error and success text attached to a field or control.",
    overview="Use directly under the control it describes. For several problems, add an error summary (see Form layout).",
    parts=[("Icon", "Warning glyph for errors"), ("Text", "Short, specific")],
    variants=[("Hint", '<span class="field__help">At least 10 characters</span>'), ("Error", '<span class="field__error">Use at least 10 characters</span>'), ("Success", '<p class="inline-status inline-status--success" role="status">' + IC(A_OK) + "Link copied.</p>")],
    sizes=None, sizes_na="Body-small text.", states=None, responsive="Wraps under its control.",
    a11y=dict(role="Referenced by the control with <code>aria-describedby</code>.", keys=[("n/a", "Not interactive")], focus="Not focusable.", label="Errors begin with what to change.", pairs=[("Error", "--color-danger-fg", "--color-bg-surface", 4.5), ("Hint", "--color-fg-muted", "--color-bg-surface", 4.5)]),
    content="<p>“Enter an email address”, not “Invalid”.</p>",
    dodont=[('<span class="field__error">Enter an email address</span>', "Says how to fix.", '<span class="field__error">Invalid</span>', "Says nothing."), ('<span class="field__help">Up to 60 characters</span>', "Hint states the rule.", '<span class="field__help">Be creative!</span>', "Hint with no information.")],
    tokens=[("Error text", "--color-danger-fg"), ("Hint text", "--color-fg-muted"), ("Success text", "--color-success-fg")], classes=[("field__help / field__error", "Field text"), ("inline-status--success", "Success line")], sources=["pages/sign-up/invalid", "dialogs/share/success"]))

SPECS.append(dict(
    slug="progress", name="Progress bar", group="Feedback", lead="Shows how far a known task has got, or that one is running.",
    overview="Use determinate bars when you know the fraction (track position, upload). Use indeterminate when you do not.",
    parts=[("Track", "Rounded rail"), ("Bar", "Fill in accent")],
    variants=[("Determinate", '<div class="progress" role="progressbar" aria-label="Track position" aria-valuemin="0" aria-valuemax="252" aria-valuenow="84"><div class="progress__bar" style="width:33%"></div></div>'), ("Indeterminate", '<div class="progress progress--indeterminate" role="progressbar" aria-label="Confirming email"><div class="progress__bar"></div></div>'), ("Success", '<div class="progress progress--success" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="progress__bar" style="width:100%"></div></div>')],
    sizes=None, sizes_na="Height is fixed at 8px.", states=None, responsive="Full width of its container.",
    a11y=dict(role="<code>role=\"progressbar\"</code> with <code>aria-valuenow</code>, <code>min</code>, <code>max</code>; indeterminate omits value.", keys=[("n/a", "Not interactive")], focus="Not focusable; the scrubber in the player is a slider, documented with Player bar.", label="Name says what is progressing.", pairs=[("Bar vs track", "--color-accent", "--color-bg-subtle-hover", 3)], motion="Indeterminate loops in <code>--duration-deliberate</code>; static under reduced-motion."),
    content="<p>Show remaining time or percent only when reliable.</p>",
    dodont=[('<div class="progress" role="progressbar" aria-label="Upload" aria-valuemin="0" aria-valuemax="100" aria-valuenow="40"><div class="progress__bar" style="width:40%"></div></div>', "Named and valued.", '<div class="progress"><div class="progress__bar" style="width:40%"></div></div>', "No role or name."), ('<div class="progress progress--indeterminate" role="progressbar" aria-label="Loading"><div class="progress__bar"></div></div>', "Indeterminate when unknown.", '<div class="progress" role="progressbar" aria-label="Loading" aria-valuenow="50" aria-valuemin="0" aria-valuemax="100"><div class="progress__bar" style="width:50%"></div></div>', "A fake 50% misleads.")],
    tokens=[("Track", "--color-bg-subtle-hover"), ("Bar", "--color-accent"), ("Success bar", "--color-success-solid"), ("Radius", "--radius-full")], classes=[("progress / progress__bar", "Rail and fill"), ("progress--indeterminate", "Looping bar"), ("progress--success / --danger", "Tone")], sources=["pages/verify-email/default"]))

SPECS.append(dict(
    slug="spinner", name="Spinner", group="Feedback", lead="A small rotating ring for short, unknown waits inside a control.",
    overview="Use inside a busy button or next to a short label. For page loads use a skeleton.",
    parts=[("Ring", "Border with a transparent quarter")],
    variants=[("Inline", '<span role="status"><span class="spinner" aria-hidden="true"></span><span class="visually-hidden">Loading tracks</span></span>'), ("In a button", '<button class="btn btn--primary" type="button" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>Saving…</button>')],
    sizes=[("Default", '<span class="spinner" role="img" aria-label="Loading"></span>'), ("Large", '<span class="spinner spinner--lg" role="img" aria-label="Loading large"></span>')],
    states=None, responsive="Same at every width.",
    a11y=dict(role="Wrap in <code>role=\"status\"</code> with hidden text such as “Loading tracks”.", keys=[("n/a", "Not interactive")], focus="Not focusable.", label="Hidden text names what is loading.", pairs=[("Ring", "--color-accent", "--color-bg-surface", 3)], motion="Rotates once per second; shows a static ring under reduced-motion."),
    content="<p>Pair with a gerund: “Saving…”.</p>",
    dodont=[('<button class="btn btn--primary" type="button" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>Saving…</button>', "Spinner plus text in a button.", '<span class="spinner" aria-hidden="true"></span>', "A silent spinner."), ('<div class="skeleton skeleton--rect" style="height:4rem"></div>', "Skeleton for page loads.", '<div style="display:grid;place-items:center;height:4rem"><span class="spinner" role="img" aria-label="Loading"></span></div>', "A spinner on a blank page.")],
    tokens=[("Ring", "--color-accent"), ("Rail", "--color-border-default")], classes=[("spinner / spinner--lg", "Ring sizes")], sources=["pages/sign-in/submitting", "dialogs/create-playlist/busy"]))

SPECS.append(dict(
    slug="skeleton", name="Skeleton", group="Feedback", lead="Placeholder blocks that match the final layout while content loads.",
    overview="Use for first loads of lists, tiles and pages. The skeleton must have the same dimensions as the content to avoid layout shift.",
    parts=[("Block", "Shimmering shape in the final size")],
    variants=[("Text and title", '<div aria-busy="true" aria-label="Loading"><div class="skeleton skeleton--title"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>'), ("Media tile", '<div class="tile" aria-hidden="true" style="max-width:10rem"><div class="skeleton skeleton--rect" style="aspect-ratio:1"></div><div class="skeleton skeleton--text"></div><div class="skeleton skeleton--text"></div></div>')],
    sizes=None, sizes_na="Sizes mirror the loaded content.", states=None, responsive="Skeletons use the same grid as the content they replace.",
    a11y=dict(role="Skeleton shapes are <code>aria-hidden</code>; the container has <code>aria-busy=\"true\"</code>.", keys=[("n/a", "Not interactive")], focus="Not focusable.", label="The container’s label says what is loading.", motion="Shimmer is replaced by a static tint under reduced-motion."),
    content="<p>No text inside skeletons.</p>",
    dodont=[('<div class="skeleton skeleton--rect" style="height:3rem"></div>', "Matches the final height.", '<div class="skeleton skeleton--rect" style="height:1rem"></div>', "Content jumps when it arrives."), ('<div aria-busy="true"><div class="skeleton skeleton--text"></div></div>', "Marked busy.", '<div><div class="skeleton skeleton--text"></div></div>', "Not announced as loading.")],
    tokens=[("Base", "--color-bg-subtle"), ("Highlight", "--color-bg-subtle-hover"), ("Radius", "--radius-sm")], classes=[("skeleton", "Block"), ("skeleton--text / --title / --rect / --circle", "Shapes")], sources=["pages/home/loading", "pages/playlist/loading"]))

EMPTY = '<div class="empty empty--compact"><div class="empty__icon">' + IC('<path d="M5 4v16M10 4v16M15 6l4 14"/>') + '</div><h3 class="empty__title">Your library is empty</h3><p class="text-muted">Like a track or create a playlist and it will live here.</p><div class="empty__actions"><button class="btn btn--primary" type="button">Create a playlist</button></div></div>'
SPECS.append(dict(
    slug="empty-state", name="Empty state", group="Feedback", lead="Explains why a place is empty and offers the one next step.",
    overview="Use for first-run, no results and permission states. Keep the page chrome and filters visible.",
    parts=[("Icon", "Tone cue"), ("Title", "What is empty"), ("Text", "Why and what happens next"), ("Action", "One primary button, optional link")],
    variants=[("First run", EMPTY), ("No results", '<div class="empty empty--compact"><div class="empty__icon">' + IC('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') + '</div><h3 class="empty__title">Nothing matches “rainfall in b-flat”</h3><p class="text-muted">Check the spelling or browse by genre.</p><div class="empty__actions"><button class="btn" type="button">Clear search</button></div></div>'),
              ("Error", '<div class="empty empty--compact empty--error" role="alert"><div class="empty__icon">' + IC(A_ERR) + '</div><h3 class="empty__title">We couldn’t load this page</h3><p class="text-muted">Your music hasn’t gone anywhere. Try again.</p><div class="empty__actions"><button class="btn btn--primary" type="button">Try again</button></div></div>')],
    sizes=[("Compact", EMPTY), ("Full", EMPTY.replace("empty empty--compact", "empty"))], states=None,
    responsive="Content is centred and capped at 28rem; padding shrinks under 640px.",
    a11y=dict(role="Headings and text; error variants use <code>role=\"alert\"</code>.", keys=[("Tab", "Reaches the action")], focus="Standard ring.", label="Title names the state.", pairs=[("Text", "--color-fg-muted", "--color-bg-canvas", 4.5)]),
    content="<p>Formula: what is empty, why, next step. “Your library is empty. Like a track or create a playlist and it lives here.”</p>",
    dodont=[(EMPTY, "One action.", EMPTY.replace('</div></div>', '<button class="btn" type="button">Other</button><button class="btn" type="button">Another</button></div></div>', 1), "Competing actions."), (EMPTY, "Explains why.", '<div class="empty empty--compact"><h3 class="empty__title">No data</h3></div>', "No reason or next step.")],
    tokens=[("Icon background", "--color-bg-subtle"), ("Text", "--color-fg-muted"), ("Error icon", "--color-danger-icon")], classes=[("empty / empty--compact", "Container"), ("empty--error", "Error tone"), ("empty__icon / __title / __actions", "Parts")], sources=["pages/library/empty", "pages/search/no-results", "pages/home/error"]))

SPECS.append(dict(
    slug="error-page", name="Error page", group="Feedback", lead="Full-page 404, 403, 500 and offline states that keep the app shell.",
    overview="Show the code as an overline, a plain-language title, one sentence and one way forward. Keep the navigation so people can move on.",
    parts=[("Code", "Overline"), ("Title", "h1"), ("Text", "Reason and reassurance"), ("Actions", "Primary recovery, secondary link")],
    variants=[("404", '<div class="empty"><div class="empty__icon">' + IC('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') + '</div><p class="overline">404</p><h3 class="empty__title">We couldn’t find that page</h3><p class="text-muted">The link may be old or mistyped.</p><div class="empty__actions"><a class="btn btn--primary" href="#code">Go to Home</a></div></div>'),
              ("Offline", '<div class="empty"><div class="empty__icon">' + IC('<path d="M3 3l18 18M8.5 8.5A11 11 0 0 0 2 11"/>') + '</div><p class="overline">Offline</p><h3 class="empty__title">You’re offline</h3><p class="text-muted">Saved tracks still play.</p><div class="empty__actions"><button class="btn btn--primary" type="button">Retry</button></div></div>')],
    sizes=None, sizes_na="Full page only.", states=None, responsive="Centred column; padding shrinks under 640px.",
    a11y=dict(role="The title is the page’s <code>h1</code>.", keys=[("Tab", "Reaches the recovery action first")], focus="Focus starts at the top of the page.", label="Title states the problem in words.", pairs=[("Text", "--color-fg-muted", "--color-bg-canvas", 4.5)]),
    content="<p>Own the problem: “Something broke on our side”. Never blame the person.</p>",
    dodont=[('<h3 class="empty__title">Something broke on our side</h3>', "Plain language.", '<h3 class="empty__title">Error 500: Internal Server Error</h3>', "Jargon."), ('<a class="btn btn--primary" href="#code">Go to Home</a>', "One clear way out.", '<p>Try again later.</p>', "No action.")],
    tokens=[("Text", "--color-fg-muted"), ("Icon", "--color-bg-subtle")], classes=[("empty", "Container used for error pages")], sources=["pages/not-found/default", "pages/forbidden/default", "pages/server-error/default", "pages/offline/default"]))

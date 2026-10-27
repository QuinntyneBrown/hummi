"""The eight pattern pages."""
from base import *
from comps_a import IC, field_html
from comps_c import toast, alert, A_INFO, A_OK, A_WARN, A_ERR, EMPTY, TBL
from comps_d import TR

PATS = []


def pat(slug, name, lead, overview, when, structure, states, responsive, a11y, content, dd, sources):
    PATS.append(dict(slug=slug, name=name, lead=lead, overview=overview, when=when, structure=structure, states=states, responsive=responsive, a11y=a11y, content=content, dd=dd, sources=sources))


FORM = ('<form class="stack" novalidate><div class="form-summary" role="alert" tabindex="-1"><strong>Fix 1 thing to continue</strong><ul><li><a href="#states">Enter a display name</a></li></ul></div>'
        + field_html("Display name", value="", error="Enter a display name") + field_html("Email", "email", "priya@example.com") + '<div class="form-actions"><button class="btn btn--primary" type="submit">Save changes</button><button class="btn" type="button">Cancel</button></div></form>')
pat("forms", "Forms", "Layout, validation timing, error summary and submit states.", "Forms collect input with as little friction as possible. One column, visible labels, validation that helps rather than scolds.",
    "<ul><li>Use a page form for account and settings; a dialog form for one to three fields.</li><li>Validate on blur, then on input once a field has been touched. Never clear typed values.</li><li>Destructive confirmations use a typed name only when the loss is large.</li></ul>",
    FORM, "<p>Submitting: the primary button shows a spinner and <code>aria-busy</code>, fields turn read-only, width does not change. Failed: the summary appears at the top and takes focus. Success: say what happened and where to go next.</p>",
    "<p>Single column at every width. Two-column layouts collapse under 768px. Primary buttons go full width under 640px.</p>", "<ul><li>Every control has a label; errors use <code>aria-describedby</code> and <code>aria-invalid</code>.</li><li>The summary is <code>role=\"alert\"</code> with links to fields.</li></ul>",
    "<p>Labels are nouns; errors say how to fix; button verbs name the result.</p>",
    [(FORM, "Summary, inline errors, one primary.", field_html("Name", error="Error") + field_html("Email", error="Error"), "Inline errors with no summary and vague copy.")], ["pages/sign-up/invalid", "pages/settings/invalid", "dialogs/create-playlist/invalid"])

pat("feedback-and-loading", "Feedback and loading", "Which feedback for which action, and skeleton vs spinner vs progress.", "Match the feedback to the scope and urgency of what happened.",
    table(["Situation", "Use"], [("A field is wrong", "Inline message"), ("An action just completed", "Toast (with Undo if reversible)"), ("A section’s state changed", "Inline alert"), ("The whole page is affected", "Banner"), ("A decision is needed", "Dialog"), ("Content is loading", "Skeleton"), ("A button is working", "Spinner inside the button"), ("A task has a known fraction", "Progress bar")]),
    toast("success", "Added to Late-night coding", "“Slow Orbit” is now track 25.", "Undo") + alert("warning", "You are offline", "Showing saved tracks.", A_WARN),
    "<p>Loading: skeletons that match the final layout. Busy: control disabled with a spinner, no layout shift. Optimistic: show the result at once and offer Undo; roll back with an error toast if it fails.</p>",
    "<p>Toasts go full width on phones. Banners wrap. Skeletons use the same grid as content.</p>", "<ul><li>Toast region is a polite live region; errors use <code>role=\"alert\"</code>.</li><li>Skeleton containers are <code>aria-busy</code>.</li><li>Feedback never steals focus.</li></ul>",
    "<p>Say what happened in the past tense. Offer one way forward.</p>",
    [(toast("success", "Added to Late-night coding", "Slow Orbit is track 25.", "Undo"), "Toast for completed, reversible actions.", '<div class="empty empty--compact"><h3 class="empty__title">Added</h3></div>', "A full-page state for a small action.")], ["notifications/toast/success", "pages/home/loading", "pages/sign-in/submitting"])

pat("empty-and-error-states", "Empty and error states", "Copy formulas and when to use each.", "Empty and error states keep the page chrome, explain what is going on and offer one next step.",
    table(["State", "Use when", "Component"], [("First run", "Nothing exists yet", "Empty state"), ("No results", "Filters or search matched nothing; keep filters visible", "Empty state"), ("Permission", "The person cannot see this", "Empty state with sign-in action"), ("Load error", "A request failed", "Empty state, error tone, with Try again"), ("Page error", "Route-level 404, 403, 500, offline", "Error page")]),
    EMPTY, "<p>Partial: when one section fails, show an inline error in that section and keep the rest working (see Home · partial).</p>",
    "<p>Content is centred, max 28rem, with the action below.</p>", "<ul><li>Error variants use <code>role=\"alert\"</code>.</li><li>The page keeps its landmarks and a single <code>h1</code>.</li></ul>",
    "<p>What is empty, why, one next step. Own the problem on errors.</p>",
    [(EMPTY, "Explain and offer one step.", '<div class="empty empty--compact"><h3 class="empty__title">No data</h3></div>', "A dead end.")], ["pages/library/empty", "pages/search/no-results", "pages/home/partial", "pages/not-found/default"])

NAVEX = '<nav aria-label="Breadcrumb"><ol class="breadcrumb"><li><a href="#overview">Browse</a></li><li aria-current="page">Ambient</li></ol></nav><div class="page-header"><div><h2 style="font:var(--text-h2)">Ambient</h2><p class="subtitle">1,204 tracks</p></div><div class="cluster"><button class="btn btn--primary" type="button">Play all</button></div></div>'
pat("navigation-and-page-structure", "Navigation and page structure", "Shell, page header, breadcrumbs and back behaviour.", "Every page sits in the same shell: sidebar, top bar, main and player bar.",
    "<ul><li>Top-level destinations live in the sidebar; there are five.</li><li>Use tabs for peer views of the same content; sub-pages when each has its own URL and heavy content.</li><li>Breadcrumbs appear two levels down.</li></ul>",
    NAVEX, "<p>Current location is marked with <code>aria-current</code>. The page header keeps its title in every state, including loading and error.</p>",
    "<p>Sidebar collapses under 1024px; the page header wraps actions below the title.</p>", "<ul><li>Landmarks: header, nav, main, footer; skip link first.</li><li>Back uses the browser history; no custom back buttons.</li></ul>", "<p>Page titles are nouns; actions are verbs.</p>",
    [(NAVEX, "Title and page actions together.", '<div class="page-header"><div><h2 style="font:var(--text-h2)">Ambient</h2></div></div><div class="cluster"><button class="btn btn--primary" type="button">Play all</button></div>', "Actions separated from the title.")], ["pages/home/default", "pages/genre/default"])

pat("dialogs-and-overlays", "Dialogs and overlays", "Dialog vs drawer vs popover vs page, stacking and mobile sheets.", "Overlays interrupt. Use them only when interruption serves the task.",
    table(["Need", "Use"], [("A yes/no decision", "Dialog"), ("A short form", "Dialog"), ("A list of actions on an object", "Menu"), ("A label for an icon", "Tooltip"), ("A long or multi-step task", "A page")]),
    '<div class="dialog__panel" style="position:static;max-width:26rem"><div class="dialog__header"><div style="flex:1"><h3 class="dialog__title">Sign out of Hummi?</h3><p class="text-muted">Your playlists and likes stay saved.</p></div></div><div class="dialog__footer"><button class="btn" type="button">Cancel</button><button class="btn btn--primary" type="button">Sign out</button></div></div>',
    "<p>Dialogs have default, busy, invalid, failed and (for destructive actions) confirm states. While busy, the primary button is disabled with a spinner; Cancel is disabled too if closing would orphan the request.</p>",
    "<p>Under 640px dialogs are bottom sheets. Never stack dialogs: replace the content instead.</p>", "<ul><li>Focus moves in, is trapped, and returns to the trigger.</li><li>The page behind is <code>inert</code>; Esc closes.</li></ul>", "<p>Titles are questions or verb phrases naming the object.</p>",
    [('<div class="dialog__footer"><button class="btn" type="button">Cancel</button><button class="btn btn--danger" type="button">Delete playlist</button></div>', "Verb and object on the button.", '<div class="dialog__footer"><button class="btn" type="button">No</button><button class="btn btn--danger" type="button">Yes</button></div>', "Yes and No force a re-read of the question.")], ["dialogs/create-playlist/default", "dialogs/delete-playlist/confirm", "dialogs/report-track/failed"])

pat("data-tables-and-lists", "Data tables and lists", "Density, selection, bulk actions and responsive strategy.", "Tables compare; lists browse. Hummi mostly browses, so lists and track rows dominate.",
    "<ul><li>Track collections: track rows.</li><li>Two-line records: list.</li><li>Comparing attributes: table (licences, settings).</li></ul>", TR + TBL,
    "<p>Selected rows show a bulk action bar above the list (see Playlist · selected). Loading uses skeleton rows; empty states replace the list; no-results keeps filters visible.</p>",
    "<p>Tables scroll inside <code>table-wrap</code>; track rows truncate and hide secondary columns on phones.</p>", "<ul><li>Tables have a caption and header scopes.</li><li>Row actions are reachable by keyboard.</li></ul>", "<p>Column headers are nouns; numbers align right.</p>",
    [(TR, "Row with named actions.", TR.replace("Like Glass Rain", "Like"), "Identical labels.")], ["pages/playlist/selected", "pages/licence/default", "pages/queue/default"])

pat("notifications", "Notifications", "Toast vs banner vs notification centre, priority and auto-dismiss rules.", "Three channels with different lifetimes.",
    table(["Channel", "Lifetime", "Use"], [("Toast", "8 s; errors persist", "Result of an action"), ("Banner", "Until resolved or dismissed", "Page-wide state: offline, maintenance, verify email"), ("Notification centre", "Until read", "Events from other people or the system")]),
    toast("info", "Added to queue", "“Glass Rain” plays after the current track.") + alert("info", "Scheduled maintenance", "Read-only on Sunday 1 Nov, 02:00 to 02:30 UTC.", A_INFO),
    "<p>Stacked toasts show at most three; older ones collapse. Danger toasts never auto-dismiss. The unread count lives on the Notifications link and the bell.</p>",
    "<p>Toasts are full width on phones and bottom right from 640px; banners sit above the top bar.</p>", "<ul><li>One polite live region exists before any toast arrives.</li><li>Unread dots and counts have spoken labels.</li></ul>", "<p>Past tense for events; specific actors and objects.</p>",
    [(toast("success", "Added to Late-night coding", "Slow Orbit is track 25.", "Undo"), "Toast for a result.", toast("info", "Welcome back!", "Check out what’s new."), "Marketing in a toast.")], ["notifications/toast/stacked", "notifications/banner/persistent", "pages/notifications/default"])

pat("content-and-tone", "Content and tone", "Voice, casing, numbers and the microcopy library.", "Words are part of the interface. See the Content foundation for the full rules and the microcopy library.",
    "<p>Apply these rules to every label, message and empty state before it ships.</p>",
    '<div class="card stack"><h3>Before and after</h3>' + table(["Before", "After"], [("Error 500: Internal Server Error", "Something broke on our side. Nothing you saved is lost."), ("Click here to submit", "Create account"), ("Oops! Something went wrong!!", "We couldn’t save your changes. Try again.")]) + "</div>",
    "<p>Every state has copy: loading (“Loading tracks”), empty, error, success, busy (“Saving…”).</p>",
    "<p>Copy is the same at every width; truncation happens in CSS, not in the text.</p>", "<ul><li>Link text makes sense out of context.</li><li>Messages say what changed, not just a colour.</li></ul>", "<p>Sentence case, verbs on buttons, no exclamation marks.</p>",
    [('<button class="btn btn--primary" type="button">Create account</button>', "A verb phrase.", '<button class="btn btn--primary" type="button">Submit</button>', "A generic word.")], ["pages/sign-up/default", "pages/not-found/default", "notifications/toast/danger"])


def run():
    for p in PATS:
        PATTERNS.append((p["slug"], p["name"], p["lead"]))


def render():
    for p in PATS:
        secs = [
            ("overview", "Overview", f'<p>{p["overview"]}</p>', None),
            ("when", "When to use what", p["when"], None),
            ("structure", "Structure", f'<div class="ds-example"><div class="ds-example__canvas ds-example__canvas--stack">{p["structure"]}</div></div>', None),
            ("states", "States", p["states"], None),
            ("responsive", "Responsive behaviour", p["responsive"], None),
            ("accessibility", "Accessibility", p["a11y"], None),
            ("content", "Content", p["content"], None),
            ("do-dont", "Do and don’t", dodont(p["dd"]), None),
            ("sources", "Sources", "<p>Mocks showing this pattern:</p>" + mock_links(p["sources"]), None),
        ]
        page("patterns", p["slug"], p["name"], "Pattern", p["lead"], p["lead"], secs)

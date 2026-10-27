"""Component specs: actions and inputs."""
from base import uid

IC = lambda p: f'<svg class="icon" aria-hidden="true" viewBox="0 0 24 24">{p}</svg>'
PLAY, PLUS, HEART = IC('<path d="M7 4.5v15l12-7.5z"/>'), IC('<path d="M12 5v14M5 12h14"/>'), IC('<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>')
B = lambda cls, label, a="", ic="": f'<button class="btn {cls}" type="button"{a}>{ic}{label}</button>'.replace("btn  ", "btn ").replace('btn "', 'btn"')
BTN_ROWS = [("Primary", '<button class="btn btn--primary" type="button"{a}>Play</button>'), ("Secondary", '<button class="btn" type="button"{a}>Share</button>'),
            ("Ghost", '<button class="btn btn--ghost" type="button"{a}>Cancel</button>'), ("Danger", '<button class="btn btn--danger" type="button"{a}>Delete</button>')]


def field_html(label, typ="text", value="", extra="", help="", error="", fid=None):
    i = fid or uid("f")
    inv = ' aria-invalid="true"' if error else ""
    d = []
    if help: d.append(i + "h")
    if error: d.append(i + "e")
    dd = f' aria-describedby="{" ".join(d)}"' if d else ""
    h = f'<span class="field__help" id="{i}h">{help}</span>' if help else ""
    e = f'<span class="field__error" id="{i}e">{error}</span>' if error else ""
    return f'<div class="field"><label class="field__label" for="{i}">{label}</label><input class="input" id="{i}" type="{typ}" value="{value}"{inv}{dd}{extra}>{h}{e}</div>'


SPECS = []

SPECS.append(dict(
    slug="button", name="Button", group="Actions",
    lead="Buttons trigger an action on the current page. Five variants, three sizes, every state.",
    overview="Use a button for something that <em>does</em> something: play, save, create, delete. Use a link to go somewhere. Each view has at most one primary button; everything else is secondary or ghost.",
    parts=[("Leading icon (optional)", "20px, inherits the label colour"), ("Label", "Verb phrase in sentence case"), ("Container", "40px tall, <code>--radius-md</code>, 16px inline padding")],
    figure=B("btn--primary", "Play", "", PLAY),
    variants=[("Primary", B("btn--primary", "Play", "", PLAY)), ("Secondary (default)", B("", "Share")), ("Ghost", B("btn--ghost", "Cancel")), ("Link", B("btn--link", "Read the licence")),
              ("Danger", B("btn--danger", "Delete playlist")), ("Icon only", f'<button class="btn btn--ghost btn--icon" type="button" aria-label="Like Slow Orbit">{HEART}</button>'), ("Block", B("btn--primary btn--block", "Create account"))],
    variants_note="The accent marks the single most important action. Danger is reserved for destructive actions and always follows a confirmation.",
    sizes=[("Small (32px)", B("btn--sm", "Follow")), ("Medium (40px, default)", B("", "Follow")), ("Large (48px)", B("btn--lg", "Follow"))],
    states=dict(rows=BTN_ROWS, cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Active", ' data-state="active"'), ("Disabled", " disabled"), ("Busy", ' aria-busy="true"')],
                extra='<h3>Toggle states</h3><div class="ds-example__canvas"><button class="btn" type="button" aria-pressed="false">Shuffle</button> <button class="btn" type="button" aria-pressed="true">Shuffle</button> <button class="btn" type="button" aria-expanded="false">More</button> <button class="btn" type="button" aria-expanded="true">More</button></div>'),
    responsive="Buttons keep their height at every width. Under 640px primary actions in forms and dialogs become <code>btn--block</code>; toolbars wrap onto a second line with <code>.cluster</code> instead of shrinking labels. Labels never truncate.",
    theming="Primary reads <code>--color-accent</code> with <code>--color-fg-on-accent</code>: coral with white text in light, bright coral with plum text in dark.",
    a11y=dict(role="Native <code>&lt;button type=\"button\"&gt;</code>. Toggles use <code>aria-pressed</code>; disclosure buttons use <code>aria-expanded</code>.", keys=[("Enter / Space", "Activates the button"), ("Tab", "Moves to the next control")],
              focus="A 2px ring in <code>--color-focus-ring</code>, offset 2px, appears on <code>:focus-visible</code>. Busy buttons stay focusable so focus is not lost.", label="Visible text is the name. Icon-only buttons need <code>aria-label</code> naming the action and its object (“Like Slow Orbit”).",
              pairs=[("Label on primary", "--color-fg-on-accent", "--color-accent", 4.5), ("Label on danger", "--color-fg-on-danger", "--color-danger-solid", 4.5), ("Label on secondary", "--color-fg-default", "--color-bg-surface", 4.5)],
              motion="Hover and press colour changes last <code>--duration-fast</code>.", touch="Icon-only and mobile primary buttons are 44px; small buttons are used only in dense desktop rows."),
    content="<ul><li>Verb first, sentence case: <em>Add to playlist</em>, not <em>Playlist</em> or <em>ADD</em>.</li><li>Name the object when several buttons share a view: <em>Delete playlist</em>.</li><li>While busy, switch to the gerund: <em>Saving…</em>.</li></ul>",
    dodont=[(B("btn--primary", "Play") + " " + B("", "Share"), "One primary per view; the rest are secondary.", B("btn--primary", "Play") + " " + B("btn--primary", "Share"), "Two primaries compete and weaken both."),
            (B("btn--danger", "Delete playlist"), "Say what will be deleted.", B("btn--danger", "OK"), "A vague label on a destructive action.")],
    tokens=[("Primary background", "--color-accent"), ("Primary label", "--color-fg-on-accent"), ("Secondary border", "--color-border-strong"), ("Danger background", "--color-danger-solid"), ("Corner radius", "--radius-md"), ("Height (md)", "--control-height-md"), ("Focus ring", "--color-focus-ring")],
    classes=[("btn", "Base secondary button"), ("btn--primary / --danger / --ghost / --link", "Variants"), ("btn--sm / --lg", "Sizes"), ("btn--icon", "Square icon-only button"), ("btn--block", "Full width"), ("aria-busy=\"true\"", "Busy state with spinner; width is kept"), ("data-state", "Forces hover, focus or active for documentation")],
    sources=["pages/home/default", "pages/track/default", "dialogs/delete-playlist/default", "pages/sign-in/default"]))

SPECS.append(dict(
    slug="button-group", name="Button group", group="Actions", lead="Joins related buttons into one segmented control or toolbar.",
    overview="Use a group when the buttons act on the same thing and one is usually chosen: sort order, view mode. For a single choice from many options, use radio-group or tabs instead.",
    parts=[("Group container", "<code>role=\"group\"</code> with an accessible name"), ("Segment", "A button; the selected one has <code>aria-pressed=\"true\"</code>")],
    variants=[("Segmented", '<div class="btn-group" role="group" aria-label="Sort tracks"><button class="btn" type="button" aria-pressed="true">Newest</button><button class="btn" type="button" aria-pressed="false">Most played</button></div>'),
              ("Toolbar", '<div class="btn-group" role="group" aria-label="Playback options"><button class="btn" type="button" aria-label="Shuffle">' + IC('<path d="M3 7h4l10 10h4"/>') + '</button><button class="btn" type="button" aria-label="Repeat">' + IC('<path d="M4 11V9a3 3 0 0 1 3-3h13"/>') + "</button></div>")],
    sizes=[("Small", '<div class="btn-group" role="group" aria-label="Density"><button class="btn btn--sm" type="button" aria-pressed="true">Comfortable</button><button class="btn btn--sm" type="button" aria-pressed="false">Compact</button></div>')],
    states=dict(rows=[("Segment", '<div class="btn-group" role="group" aria-label="Example"><button class="btn" type="button"{a}>One</button><button class="btn" type="button">Two</button></div>')]),
    responsive="Groups with more than three segments scroll horizontally inside their container instead of wrapping; labels stay on one line.",
    a11y=dict(role="<code>role=\"group\"</code> with <code>aria-label</code>; each segment is a toggle button using <code>aria-pressed</code>.", keys=[("Tab", "Moves between segments"), ("Enter / Space", "Selects the segment")],
              focus="Each segment shows the standard focus ring; the ring sits above neighbours.", label="The group label says what the choice controls (“Sort tracks”).", pairs=[("Selected label", "--color-fg-accent", "--color-accent-subtle", 4.5)]),
    content="<p>Use one or two words per segment. Keep labels parallel (all nouns or all adjectives).</p>",
    dodont=[('<div class="btn-group" role="group" aria-label="Sort"><button class="btn" type="button" aria-pressed="true">Newest</button><button class="btn" type="button" aria-pressed="false">Popular</button></div>', "Two or three short, parallel options.", '<div class="btn-group" role="group" aria-label="Actions"><button class="btn" type="button">Play</button><button class="btn" type="button">Delete</button></div>', "Unrelated actions are not a group."),
            ('<div class="btn-group" role="group" aria-label="View"><button class="btn" type="button" aria-pressed="true">List</button><button class="btn" type="button" aria-pressed="false">Grid</button></div>', "Exactly one segment is pressed.", '<div class="btn-group" role="group" aria-label="View"><button class="btn" type="button" aria-pressed="false">List</button><button class="btn" type="button" aria-pressed="false">Grid</button></div>', "No segment pressed leaves the state unknown.")],
    tokens=[("Selected background", "--color-accent-subtle"), ("Selected label", "--color-fg-accent"), ("Border", "--color-border-strong"), ("Radius", "--radius-md")],
    classes=[("btn-group", "Joins children, squares inner corners"), ("aria-pressed=\"true\"", "Selected segment")], sources=["pages/library/default", "pages/genre/default"]))

SPECS.append(dict(
    slug="link", name="Link", group="Actions", lead="Links navigate. They are underlined so colour is never the only cue.",
    overview="Use a link to go to another page or section. Use a button for actions. Links inside running text are inline; links in lists and headers may be standalone.",
    parts=[("Text", "Describes the destination"), ("Underline", "Always on; thickens on hover")],
    variants=[("Inline", '<p>Read the <a href="#code">licence terms</a> before you remix.</p>'), ("With icon", '<a href="#code">' + IC('<path d="M5 12h14M13 6l6 6-6 6"/>') + "See all</a>"), ("Muted track title", '<a href="#code" style="color:inherit">Slow Orbit</a>')],
    sizes=None, sizes_na="Links inherit the size of their surrounding text.",
    states=dict(rows=[("Link", '<a href="#code"{a}>Licence and credit</a>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"')]),
    responsive="Links wrap with their text. A standalone link in a toolbar keeps a 44px target on touch.",
    a11y=dict(role="Native <code>&lt;a href&gt;</code>.", keys=[("Enter", "Follows the link")], focus="Standard focus ring.", label="Link text makes sense out of context: “Licence and credit”, never “click here”.", pairs=[("Link on canvas", "--color-fg-link", "--color-bg-canvas", 4.5), ("Link on surface", "--color-fg-link", "--color-bg-surface", 4.5)]),
    content="<p>Describe the destination, not the gesture. Avoid repeating the same text for different destinations.</p>",
    dodont=[('<a href="#code">Licence and credit</a>', "Descriptive text.", '<a href="#code">Click here</a>', "Meaningless out of context."), ('<p>See the <a href="#code">licence terms</a>.</p>', "Underlined links in text.", '<p>See the <a href="#code" style="text-decoration:none">licence terms</a>.</p>', "Colour alone must not mark a link.")],
    tokens=[("Colour", "--color-fg-link"), ("Hover colour", "--color-fg-link-hover")], classes=[("a", "Styled globally: underlined, offset 0.15em")], sources=["pages/track/default", "pages/sign-in/default"]))

MENU = '<div class="menu" role="menu" aria-label="Track actions"><button class="menu__item" role="menuitem" type="button">Add to queue</button><button class="menu__item" role="menuitem" type="button">Add to playlist</button><div class="menu__divider" role="separator"></div><button class="menu__item menu__item--danger" role="menuitem" type="button">Report track</button></div>'
SPECS.append(dict(
    slug="menu", name="Menu", group="Actions", lead="A short list of actions opened from a button, such as a track’s More menu.",
    overview="Use a menu for three or more secondary actions on one object. Put the one or two common actions directly on the row instead.",
    parts=[("Trigger", "Button with <code>aria-haspopup=\"menu\"</code> and <code>aria-expanded</code>"), ("Panel", "Raised surface with <code>--shadow-3</code>"), ("Item", "Action row; danger items sit last after a divider"), ("Divider", "Separates destructive actions")],
    variants=[("Default", MENU)],
    variants_note="Menus are shown open here. In the product the panel is anchored below the trigger and closes on selection.",
    sizes=None, sizes_na="Menus take the width of their widest item, with a 12rem minimum.",
    states=dict(rows=[("Item", '<div class="menu" role="menu" aria-label="Example"><button class="menu__item" role="menuitem" type="button"{a}>Add to queue</button></div>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Disabled", " disabled")]),
    responsive="Under 640px a menu with more than five items becomes a bottom sheet (see Dialog) so items are 44px tall.",
    a11y=dict(role="WAI-ARIA Menu Button pattern: <code>role=\"menu\"</code> and <code>role=\"menuitem\"</code>.", keys=[("Enter / Space / ↓", "Opens the menu, focuses the first item"), ("↑ / ↓", "Moves between items"), ("Home / End", "First or last item"), ("Esc", "Closes and returns focus to the trigger"), ("Type a letter", "Jumps to the matching item")],
              focus="Focus moves into the menu on open and returns to the trigger on close.", label="The menu has an <code>aria-label</code> naming the object (“Track actions”).", pairs=[("Item text", "--color-fg-default", "--color-bg-surface-raised", 4.5), ("Danger item", "--color-danger-fg", "--color-bg-surface-raised", 4.5)]),
    content="<p>Verb first, sentence case. No more than seven items; group with dividers.</p>",
    dodont=[(MENU, "Destructive item last, after a divider.", '<div class="menu" role="menu" aria-label="Bad"><button class="menu__item menu__item--danger" role="menuitem" type="button">Report track</button><button class="menu__item" role="menuitem" type="button">Add to queue</button></div>', "Destructive item first invites mis-taps."),
            ('<div class="menu" role="menu" aria-label="Good"><button class="menu__item" role="menuitem" type="button">Share</button></div>', "Short verbs.", '<div class="menu" role="menu" aria-label="Bad"><button class="menu__item" role="menuitem" type="button">Click to share this track with friends</button></div>', "Sentences in menus.")],
    tokens=[("Panel background", "--color-bg-surface-raised"), ("Shadow", "--shadow-3"), ("Hover item", "--color-bg-subtle"), ("Danger text", "--color-danger-fg"), ("Radius", "--radius-md")],
    classes=[("menu", "Panel"), ("menu__item", "Action row"), ("menu__item--danger", "Destructive action"), ("menu__divider", "Separator")], sources=["pages/track/default", "pages/playlist/default"]))

# ---------------------------------------------------------------- inputs
SPECS.append(dict(
    slug="text-field", name="Text field", group="Inputs", lead="A single-line input with a visible label, optional help and an inline error.",
    overview="Use a text field for short free text: names, emails, passwords, search. Use a textarea for more than one line and a select for a fixed list.",
    parts=[("Label", "Always visible, above the input"), ("Input", "40px tall, strong border, <code>--radius-md</code>"), ("Help text", "Optional, linked with <code>aria-describedby</code>"), ("Error", "Replaces help; icon and text, never colour alone")],
    figure=field_html("Email", "email", "priya@example.com", help="We only use it to sign you in."),
    variants=[("Default", field_html("Display name", value="Priya")), ("With help", field_html("Password", "password", "", help="At least 10 characters")), ("Invalid", field_html("Email", "email", "priya@exam", error="That email address looks incomplete")),
              ("Search", '<form class="search" role="search"><label class="visually-hidden" for="ds-q">Search tracks</label>' + IC('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') + '<input class="input" id="ds-q" type="search" placeholder="Search tracks, artists, playlists"></form>'),
              ("With addon", f'<div class="field"><label class="field__label" for="ds-url">Share link</label><div class="input-group"><input class="input" id="ds-url" readonly value="https://hummi.example/s/k3Qx9pL"><button class="btn btn--primary" type="button">Copy link</button></div></div>')],
    sizes=[("Small", '<input class="input input--sm" type="text" aria-label="Small field" value="Small">'), ("Medium", '<input class="input" type="text" aria-label="Medium field" value="Medium">'), ("Large", '<input class="input input--lg" type="text" aria-label="Large field" value="Large">')],
    states=dict(rows=[("Input", '<input class="input" type="text" aria-label="Example field" value="Priya"{a}>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Disabled", " disabled"), ("Read-only", " readonly"), ("Invalid", ' aria-invalid="true"')]),
    responsive="Fields are full width of their column. Two-column forms collapse to one column under 768px. Font size is never below 16px on touch so iOS does not zoom.",
    a11y=dict(role="Native <code>&lt;input&gt;</code> with a <code>&lt;label for&gt;</code>.", keys=[("Tab", "Moves to the field"), ("Esc", "Clears a search field")], focus="Border turns accent and the standard focus ring shows.", label="Every field has a label; placeholders are examples, never labels. Errors and help are connected with <code>aria-describedby</code>; invalid fields set <code>aria-invalid=\"true\"</code>.",
              pairs=[("Input border", "--color-border-strong", "--color-bg-surface", 3), ("Placeholder", "--color-fg-subtle", "--color-bg-surface", 4.5), ("Error text", "--color-danger-fg", "--color-bg-surface", 4.5)]),
    content="<p>Labels are nouns in sentence case (“Display name”). Errors say what is wrong and how to fix it: “Use at least 10 characters”.</p>",
    dodont=[(field_html("Email", "email", "", help="We only use it to sign you in."), "A visible label above the field.", '<input class="input" type="email" aria-label="Email" placeholder="Email">', "A placeholder is not a label; it disappears while typing."),
            (field_html("Password", "password", "", error="Use at least 10 characters"), "An error that says how to fix it.", field_html("Password", "password", "", error="Invalid input"), "A vague error.")],
    tokens=[("Background", "--color-bg-surface"), ("Border", "--color-border-strong"), ("Focus ring", "--color-focus-ring"), ("Error text", "--color-danger-fg"), ("Invalid border", "--color-danger-solid"), ("Height (md)", "--control-height-md")],
    classes=[("field / field__label / field__help / field__error", "Label, help and error layout"), ("input", "The control"), ("input--sm / --lg", "Sizes"), ("input-group", "Joins an input to a button or addon"), ("search", "Search wrapper with icon")], sources=["pages/sign-in/default", "pages/sign-in/invalid", "pages/search/default", "dialogs/share/default"]))

SPECS.append(dict(
    slug="textarea", name="Textarea", group="Inputs", lead="A multi-line input for notes and descriptions.",
    overview="Use for text longer than a line, such as a report’s details. At least two rows tall; grows vertically only.",
    parts=[("Label", "Visible, with “(optional)” when it is"), ("Text area", "Resizable vertically"), ("Help or error", "Same as text field")],
    variants=[("Default", '<label class="field"><span class="field__label">Details <span class="optional">(optional)</span></span><textarea class="textarea" rows="3"></textarea></label>'), ("Invalid", '<label class="field"><span class="field__label">Details</span><textarea class="textarea" rows="3" aria-invalid="true"></textarea><span class="field__error">Tell us a little more</span></label>')],
    sizes=None, sizes_na="Height is set by the <code>rows</code> attribute.",
    states=dict(rows=[("Textarea", '<textarea class="textarea" rows="2" aria-label="Example"{a}></textarea>')], cols=[("Default", ""), ("Focus", ' data-state="focus"'), ("Disabled", " disabled"), ("Read-only", " readonly"), ("Invalid", ' aria-invalid="true"')]),
    responsive="Full width at every breakpoint; the resize handle is vertical only.",
    a11y=dict(role="Native <code>&lt;textarea&gt;</code> in a <code>&lt;label&gt;</code>.", keys=[("Tab", "Moves focus; Tab does not insert a tab character")], focus="Standard ring.", label="Label wraps the control; optional fields say “(optional)”.", pairs=[("Border", "--color-border-strong", "--color-bg-surface", 3)]),
    content="<p>Say what to write, not how long. Show a counter only when there is a hard limit.</p>",
    dodont=[('<label class="field"><span class="field__label">Details (optional)</span><textarea class="textarea" rows="2"></textarea></label>', "Mark optional fields.", '<label class="field"><span class="field__label">Details *</span><textarea class="textarea" rows="2"></textarea></label>', "A lone asterisk is not explained."),
            ('<label class="field"><span class="field__label">Note</span><textarea class="textarea" rows="3"></textarea></label>', "At least two rows.", '<label class="field"><span class="field__label">Note</span><textarea class="textarea" rows="1"></textarea></label>', "One row hides the fact that more is allowed.")],
    tokens=[("Background", "--color-bg-surface"), ("Border", "--color-border-strong"), ("Radius", "--radius-md")], classes=[("textarea", "Multi-line control")], sources=["dialogs/report-track/default"]))

SPECS.append(dict(
    slug="select", name="Select", group="Inputs", lead="A native dropdown for choosing one option from a fixed list.",
    overview="Use the native select by default: it is accessible and works with every keyboard and screen reader. Use radio-group when there are fewer than five options.",
    parts=[("Label", "Above the control"), ("Control", "Native select with the system arrow"), ("Help or error", "As text field")],
    variants=[("Default", '<label class="field"><span class="field__label">Sort by</span><select class="select"><option>Newest</option><option>Most played</option><option>Title</option></select></label>'), ("Invalid", '<label class="field"><span class="field__label">Licence</span><select class="select" aria-invalid="true"><option>Choose a licence</option><option>CC0</option></select><span class="field__error">Choose a licence</span></label>')],
    sizes=[("Small", '<select class="select input--sm" aria-label="Sort small"><option>Newest</option></select>'), ("Medium", '<select class="select" aria-label="Sort medium"><option>Newest</option></select>')],
    states=dict(rows=[("Select", '<select class="select" aria-label="Example"{a}><option>Newest</option></select>')], cols=[("Default", ""), ("Hover", ' data-state="hover"'), ("Focus", ' data-state="focus"'), ("Disabled", " disabled"), ("Invalid", ' aria-invalid="true"')]),
    responsive="Native pickers are used on touch devices; width follows the column.",
    a11y=dict(role="Native <code>&lt;select&gt;</code>.", keys=[("↑ / ↓", "Changes the option"), ("Space / Alt+↓", "Opens the list"), ("Type a letter", "Jumps to a matching option")], focus="Standard ring.", label="Label above; first option can be a prompt like “Choose a licence”.", pairs=[("Border", "--color-border-strong", "--color-bg-surface", 3)]),
    content="<p>Sort options by what people most often pick, or alphabetically for long lists.</p>",
    dodont=[('<label class="field"><span class="field__label">Sort by</span><select class="select"><option>Newest</option></select></label>', "Native control with a label.", '<select class="select" aria-label="Pick"><option>Select…</option></select>', "An unlabelled prompt is not a name."),
            ('<label class="field"><span class="field__label">Genre</span><select class="select"><option>Ambient</option></select></label>', "Use for five or more options.", '<label class="field"><span class="field__label">Visibility</span><select class="select"><option>Private</option><option>Public</option></select></label>', "Two options belong in a radio group or switch.")],
    tokens=[("Background", "--color-bg-surface"), ("Border", "--color-border-strong"), ("Radius", "--radius-md")], classes=[("select", "Native select styling")], sources=["pages/playlist/default"]))

CHK = lambda label, a="", small="": f'<label class="choice"><input type="checkbox"{a}><span class="choice__text">{label}' + (f"<small>{small}</small>" if small else "") + "</span></label>"
SPECS.append(dict(
    slug="checkbox", name="Checkbox", group="Inputs", lead="Lets people turn one or more independent options on or off.",
    overview="Use for a yes/no that is submitted with a form or for choosing several items. Use a switch for settings that apply immediately.",
    parts=[("Box", "20px, strong border"), ("Label", "Clickable; the whole row is the target"), ("Description (optional)", "Explains consequences")],
    variants=[("Single", CHK("Keep me signed in")), ("With description", CHK("Make it public", "", "Anyone can find and listen to it.")), ("Group", '<fieldset><legend>Choose playlists</legend>' + CHK("Late-night coding", " checked", "24 tracks") + CHK("Rain on the window", "", "18 tracks") + "</fieldset>")],
    sizes=None, sizes_na="The box is a fixed 20px with a 24px minimum target.",
    states=dict(rows=[("Checkbox", '<label class="choice"><input type="checkbox" aria-label="Example"{a}><span class="choice__text">Option</span></label>')], cols=[("Unchecked", ""), ("Checked", " checked"), ("Indeterminate", ' data-state="indeterminate"'), ("Focus", ' data-state="focus"'), ("Disabled", " disabled"), ("Invalid", ' aria-invalid="true"')]),
    responsive="Rows stack vertically with 24px minimum height; on touch the label row is the target.",
    a11y=dict(role="Native <code>&lt;input type=\"checkbox\"&gt;</code>; groups sit in a <code>&lt;fieldset&gt;</code> with a <code>&lt;legend&gt;</code>.", keys=[("Space", "Toggles the checkbox"), ("Tab", "Moves between checkboxes")], focus="Ring around the box.", label="The label states the option, not the action (“Make it public”).", pairs=[("Checked mark", "--color-fg-on-accent", "--color-accent", 3), ("Box border", "--color-border-strong", "--color-bg-surface", 3)]),
    content="<p>Phrase labels positively. Use “Make it public”, not “Don’t keep it private”.</p>",
    dodont=[(CHK("Make it public"), "Positive, specific label.", CHK("Don’t keep private"), "Double negatives confuse."), ('<fieldset><legend>Choose playlists</legend>' + CHK("One") + CHK("Two") + "</fieldset>", "Group in a fieldset with a legend.", CHK("One") + CHK("Two"), "Ungrouped boxes have no shared name.")],
    tokens=[("Checked background", "--color-accent"), ("Check mark", "--color-fg-on-accent"), ("Border", "--color-border-strong"), ("Invalid border", "--color-danger-solid")], classes=[("choice", "Row wrapper"), ("choice__text", "Label and description column")], sources=["pages/sign-up/default", "dialogs/add-to-playlist/default", "dialogs/create-playlist/default"]))

RAD = lambda label, name, a="", small="": f'<label class="choice"><input type="radio" name="{name}"{a}><span class="choice__text">{label}' + (f"<small>{small}</small>" if small else "") + "</span></label>"
SPECS.append(dict(
    slug="radio-group", name="Radio group", group="Inputs", lead="Chooses exactly one of a few visible options.",
    overview="Use when there are two to five options and people should see them all. More than five: use a select.",
    parts=[("Legend", "Names the choice"), ("Radio", "Round control, one selected"), ("Label", "Option name with optional description")],
    variants=[("Vertical", "<fieldset><legend>Theme</legend>" + RAD("Match my device", "ds-theme", " checked") + RAD("Light", "ds-theme") + RAD("Dark", "ds-theme") + "</fieldset>"), ("With descriptions", "<fieldset><legend>Condition</legend>" + RAD("Public", "ds-vis", " checked", "Anyone can listen") + RAD("Private", "ds-vis", "", "Only you") + "</fieldset>")],
    sizes=None, sizes_na="The control is a fixed 20px.",
    states=dict(rows=[("Radio", '<label class="choice"><input type="radio" name="ds-state" aria-label="Example"{a}><span class="choice__text">Option</span></label>')], cols=[("Unselected", ""), ("Selected", " checked"), ("Focus", ' data-state="focus"'), ("Disabled", " disabled")]),
    responsive="Options stack; horizontal layouts collapse to vertical under 640px.",
    a11y=dict(role="Native radios sharing a <code>name</code> inside a <code>&lt;fieldset&gt;</code>.", keys=[("↑ ↓ ← →", "Moves and selects the next option"), ("Tab", "Enters or leaves the group")], focus="Ring on the selected radio.", label="Legend names the group; each label names an option.", pairs=[("Selected dot", "--color-fg-on-accent", "--color-accent", 3)]),
    content="<p>Options are parallel phrases; put the default first.</p>",
    dodont=[("<fieldset><legend>Theme</legend>" + RAD("Light", "ds-a", " checked") + RAD("Dark", "ds-a") + "</fieldset>", "One option selected by default.", "<fieldset><legend>Theme</legend>" + RAD("Light", "ds-b") + RAD("Dark", "ds-b") + "</fieldset>", "Nothing selected forces a decision without guidance."),
            ("<fieldset><legend>Visibility</legend>" + RAD("Public", "ds-c", " checked") + RAD("Private", "ds-c") + "</fieldset>", "Radios for mutually exclusive options.", CHK("Public") + CHK("Private"), "Checkboxes allow contradictory answers.")],
    tokens=[("Selected background", "--color-accent"), ("Dot", "--color-fg-on-accent"), ("Border", "--color-border-strong")], classes=[("choice", "Row wrapper with a radio input")], sources=["pages/settings/default"]))

SW = lambda label, a="", small="": f'<label class="switch"><input type="checkbox" role="switch"{a}><span class="choice__text">{label}' + (f'<small class="text-muted">{small}</small>' if small else "") + "</span></label>"
SPECS.append(dict(
    slug="switch", name="Switch", group="Inputs", lead="Turns a setting on or off immediately.",
    overview="Use for settings that take effect at once, like autoplay. If the change needs a Save button, use a checkbox.",
    parts=[("Track", "Pill, accent when on"), ("Thumb", "Moves with a short transition"), ("Label", "Names the setting, with optional description")],
    variants=[("Off", SW("Crossfade", "", "Blend the end of one track into the next.")), ("On", SW("Autoplay similar tracks", " checked", "Keep playing when your queue ends."))],
    sizes=None, sizes_na="The track is a fixed 44×24px.",
    states=dict(rows=[("Switch", '<label class="switch"><input type="checkbox" role="switch" aria-label="Example"{a}></label>')], cols=[("Off", ""), ("On", " checked"), ("Focus", ' data-state="focus"'), ("Disabled", " disabled")]),
    responsive="Label on the right of the switch at every width; long descriptions wrap.",
    a11y=dict(role="<code>&lt;input type=\"checkbox\" role=\"switch\"&gt;</code>.", keys=[("Space", "Toggles"), ("Tab", "Moves between switches")], focus="Ring around the track.", label="The label describes the setting, not the action: “Crossfade”, not “Turn on crossfade”.", pairs=[("Off track vs surface", "--color-border-strong", "--color-bg-surface", 3)],
              motion="The thumb slides in <code>--duration-fast</code>; no motion under reduced-motion."),
    content="<p>Name the feature. Put consequences in the description, not the label.</p>",
    dodont=[(SW("Crossfade", " checked"), "A noun for the setting.", SW("Enable crossfade"), "A verb implies a one-time action."), (SW("Autoplay", " checked"), "Takes effect immediately.", SW("Autoplay") + '<button class="btn btn--primary" type="button">Save</button>', "A switch followed by a Save button is a checkbox in disguise.")],
    tokens=[("On track", "--color-accent"), ("Off track", "--color-border-strong"), ("Thumb", "--color-bg-surface"), ("Duration", "--duration-fast")], classes=[("switch", "Wrapper label"), ("role=\"switch\"", "Announces on/off")], sources=["pages/settings/default"]))

SPECS.append(dict(
    slug="form-field", name="Form field", group="Inputs", lead="The wrapper every input uses: label, control, help, error and counter in a fixed order.",
    overview="Wrap every input in a form field so spacing and error placement are the same everywhere.",
    parts=[("Label", "<code>field__label</code>"), ("Control", "Input, textarea or select"), ("Help", "<code>field__help</code>"), ("Error", "<code>field__error</code>, replaces help"), ("Counter", "<code>field__counter</code> for hard limits")],
    variants=[("Label, control and help", field_html("Playlist name", value="Rainy Sunday", help="Up to 60 characters")), ("With error", field_html("Playlist name", value="", error="Give your playlist a name"))],
    sizes=None, sizes_na="The field takes the width of its container.",
    states=dict(rows=[("Field", field_html("Name", value="Priya"))], cols=[("Default", "")]),
    responsive="Gap between parts is 4px; gap between fields is 16px; two-column forms use <code>.grid</code> and collapse under 768px.",
    a11y=dict(role="Label is a <code>&lt;label for&gt;</code>; help and error are referenced by <code>aria-describedby</code>.", keys=[("Tab", "Moves between fields")], focus="On the control, never on the wrapper.", label="Required fields say “required” in the label text; an asterisk alone is not enough.", pairs=[("Help text", "--color-fg-muted", "--color-bg-surface", 4.5), ("Error text", "--color-danger-fg", "--color-bg-surface", 4.5)]),
    content="<p>Labels are short nouns; help is one sentence; errors say how to fix.</p>",
    dodont=[(field_html("Email", "email", "", help="We only use it to sign you in."), "Help below the control.", '<div class="field"><span class="field__help">We only use it to sign you in.</span><input class="input" type="email" aria-label="Email"></div>', "Help above the control separates it from the label."), (field_html("Name", error="Enter a name"), "Error replaces help.", field_html("Name", help="Your name", error="Enter a name"), "Help and error together add noise.")],
    tokens=[("Gap", "--space-1"), ("Error text", "--color-danger-fg"), ("Label text", "--color-fg-default")], classes=[("field", "Vertical stack"), ("field__label / __help / __error / __counter", "Parts")], sources=["pages/sign-up/invalid", "dialogs/create-playlist/invalid"]))

SPECS.append(dict(
    slug="form-layout", name="Form layout", group="Inputs", lead="How fields, the error summary and the actions bar sit together on a page.",
    overview="Stack fields in one column. Show an error summary at the top after a failed submit, with links to each field, and keep the primary action at the end.",
    parts=[("Error summary", "Appears after submit with links"), ("Fields", "One column, 16px apart"), ("Actions bar", "Primary then secondary")],
    variants=[("Invalid submit", '<form class="stack" novalidate><div class="form-summary" role="alert" tabindex="-1"><strong>Fix 1 thing to continue</strong><ul><li><a href="#ds-name">Enter a display name</a></li></ul></div>' + field_html("Display name", value="", error="Enter a display name", fid="ds-name") + '<div class="form-actions"><button class="btn btn--primary" type="submit">Save changes</button><button class="btn" type="button">Cancel</button></div></form>'),
              ("Submitting", '<form class="stack"><div class="field"><label class="field__label" for="ds-sub">Display name</label><input class="input" id="ds-sub" value="Priya" readonly></div><div class="form-actions"><button class="btn btn--primary" type="submit" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>Saving…</button></div></form>')],
    sizes=None, sizes_na="Forms are one column; width is set by the page template.",
    states=dict(rows=[("Actions", '<div class="form-actions"><button class="btn btn--primary" type="submit"{a}>Save changes</button></div>')], cols=[("Default", ""), ("Busy", ' aria-busy="true" disabled')]),
    responsive="Single column at every width; the actions bar stacks and primary buttons go block under 640px.",
    a11y=dict(role="Native form with <code>novalidate</code> and custom messages; the summary is <code>role=\"alert\"</code>.", keys=[("Enter", "Submits from any single-line field"), ("Tab", "Moves through fields in reading order")], focus="After a failed submit focus moves to the summary; each link jumps to its field.", label="Summary heading counts the problems.", pairs=[("Summary text", "--color-danger-fg", "--color-danger-bg", 4.5)]),
    content="<p>Validate on blur, re-validate on input once a field has been touched. Never clear what someone typed.</p>",
    dodont=[('<div class="form-summary" role="alert"><strong>Fix 2 things</strong><ul><li><a href="#ds-x">Enter a name</a></li><li><a href="#ds-y">Use a valid email</a></li></ul></div>' + field_html("Name", error="Enter a name", fid="ds-x") + field_html("Email", "email", "priya@exam", error="Use a valid email", fid="ds-y"), "Summary links to each field.", '<div class="form-summary" role="alert"><strong>There were errors.</strong></div>', "A summary with no links."),
            ('<div class="form-actions"><button class="btn btn--primary" type="submit">Save</button><button class="btn" type="button">Cancel</button></div>', "Primary first, cancel second.", '<div class="form-actions"><button class="btn" type="button">Cancel</button><button class="btn" type="submit">Save</button></div>', "No emphasis on the main action.")],
    tokens=[("Summary background", "--color-danger-bg"), ("Summary text", "--color-danger-fg"), ("Gap", "--space-4")], classes=[("form-summary", "Error summary"), ("form-actions", "Actions row")], sources=["pages/sign-up/invalid", "pages/settings/invalid"]))

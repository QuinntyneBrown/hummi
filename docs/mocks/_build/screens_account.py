"""Account and system pages: auth, settings, notifications, licence, error screens."""
from kit import *
from screens_discover import frame, err, D

LOGO = ('<div class="logo"><img class="brand-logo brand-logo--light" src="../../assets/brand/hummi-wordmark-coral.svg" alt="Hummi">'
        '<img class="brand-logo brand-logo--dark" src="../../assets/brand/hummi-wordmark-cream.svg" alt="" aria-hidden="true"></div>')


def auth(title, intro, form, footer=""):
    return (f'<main id="main" class="auth-layout"><div class="auth-card">{LOGO}<div class="card stack"><div><h1 style="font:var(--text-h2)">{esc(title)}</h1>'
            f'<p class="text-muted" style="margin-top:var(--space-1)">{intro}</p></div>{form}</div>{footer}</div></main>')


def submit(label, busy=False):
    if busy:
        return f'<button class="btn btn--primary btn--lg btn--block" type="submit" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>{label}…</button>'
    return f'<button class="btn btn--primary btn--lg btn--block" type="submit">{label}</button>'


def sign_in(state):
    inv = state == "invalid"
    busy = state == "submitting"
    ro = " readonly" if busy else ""
    top = ""
    if inv:
        top = summary([("email", "Enter the email you signed up with"), ("password", "Enter your password")])
    if state == "error":
        top = alert("danger", "That email and password don’t match", "Check both and try again, or <a href=\"" + P("reset-password") + "\">reset your password</a>.")
    form = (f'<form class="stack" novalidate>{top}'
            + field("Email", "email", "email", "" if inv else "nadia@example.com", error="Enter the email you signed up with" if inv else "", extra=f' autocomplete="email"{ro}', req=True)
            + field("Password", "password", "password", "" if inv else "••••••••••", error="Enter your password" if inv else "", extra=f' autocomplete="current-password"{ro}', req=True)
            + f'<div class="cluster cluster--between"><label class="choice"><input type="checkbox" checked><span class="choice__text">Keep me signed in</span></label><a href="{P("reset-password")}">Forgot password?</a></div>'
            + submit("Sign in", busy) + '</form>')
    foot = f'<p class="text-muted" style="margin-top:var(--space-4);text-align:center">New to Hummi? <a href="{P("sign-up")}">Create a free account</a></p>'
    return auth("Welcome back", "Sign in to pick up where you left off.", form, foot)


def sign_up(state):
    inv = state == "invalid"; busy = state == "submitting"
    ro = " readonly" if busy else ""
    if state == "success":
        return auth("Check your inbox", "We sent a confirmation link to <strong>nadia@example.com</strong>. It works for 24 hours.",
                    alert("success", "Account created", "Open the link to start listening. Wrong address? <a href=\"" + P("sign-up") + "\">Start again</a>.") + btn("I’ve confirmed my email", "primary", href=P("verify-email")))
    top = ""
    if inv:
        top = summary([("name", "Enter a display name"), ("email", "That email address looks incomplete"), ("password", "Use at least 10 characters")])
    if state == "error":
        top = alert("danger", "We couldn’t create your account", "Something went wrong on our side. Nothing was saved; try again in a moment.")
    form = (f'<form class="stack" novalidate>{top}'
            + field("Display name", "name", "text", "" if inv else "Nadia", error="Enter a display name" if inv else "", extra=ro, req=True)
            + field("Email", "email", "email", "nadia@exam" if inv else "nadia@example.com", error="That email address looks incomplete" if inv else "", extra=ro, req=True)
            + field("Password", "password", "password", "short" if inv else "••••••••••••", help="At least 10 characters", error="Use at least 10 characters" if inv else "", extra=ro, req=True)
            + '<label class="choice"><input type="checkbox" checked><span class="choice__text">I agree to the terms and the community rules<small>Hummi is free. You can listen without an account, but saving needs one.</small></span></label>'
            + submit("Create account", busy) + '</form>')
    return auth("Create your free account", "Save playlists, follow artists and keep your place across devices.", form,
                f'<p class="text-muted" style="margin-top:var(--space-4);text-align:center">Already have an account? <a href="{P("sign-in")}">Sign in</a></p>')


def reset_password(state):
    inv = state == "invalid"; busy = state == "submitting"
    if state == "success":
        return auth("Check your inbox", "If an account exists for <strong>nadia@example.com</strong>, a reset link is on its way. It works for 1 hour.",
                    btn("Back to sign in", "primary", href=P("sign-in")))
    top = summary([("email", "Enter the email you signed up with")]) if inv else ""
    if state == "error":
        top = alert("danger", "We couldn’t send the email", "Try again in a minute. If it keeps happening, contact support.")
    form = (f'<form class="stack" novalidate>{top}' + field("Email", "email", "email", "" if inv else "nadia@example.com", error="Enter the email you signed up with" if inv else "", extra=" readonly" if busy else "", req=True)
            + submit("Send reset link", busy) + f'<a class="btn btn--ghost btn--block" href="{P("sign-in")}">Back to sign in</a></form>')
    return auth("Reset your password", "Enter your email and we’ll send a link to choose a new one.", form)


def new_password(state):
    inv = state == "invalid"; busy = state == "submitting"
    if state == "success":
        return auth("Password changed", "Sign in with your new password.", btn("Sign in", "primary", href=P("sign-in")))
    if state == "error":
        return auth("This link has expired", "Reset links work for 1 hour. Request a new one to choose a password.",
                    btn("Request a new link", "primary", href=P("reset-password")) + f'<a class="btn btn--ghost btn--block" href="{P("sign-in")}">Back to sign in</a>')
    top = summary([("password", "Use at least 10 characters")]) if inv else ""
    form = (f'<form class="stack" novalidate>{top}' + field("New password", "password", "password", "short" if inv else "••••••••••••", help="At least 10 characters", error="Use at least 10 characters" if inv else "", extra=' autocomplete="new-password"' + (" readonly" if busy else ""), req=True)
            + submit("Change password", busy) + f'<a class="btn btn--ghost btn--block" href="{P("sign-in")}">Back to sign in</a></form>')
    return auth("Choose a new password", "Pick a new password for your Hummi account.", form)


def verify_email(state):
    if state == "success":
        return auth("Email confirmed", "You’re all set, Nadia. Your account is ready.", btn("Start listening", "primary", href=P("home")))
    if state == "error":
        return auth("This link has expired", "Confirmation links work for 24 hours. We can send a fresh one.", btn("Send a new link", "primary", href=P("verify-email")) + f'<a class="btn btn--ghost btn--block" href="{P("sign-in")}">Back to sign in</a>')
    return auth("Confirming your email…", "This takes a moment. You’ll be taken to Hummi when it’s done.", '<div class="progress progress--indeterminate" role="progressbar" aria-label="Confirming email"><div class="progress__bar"></div></div>')


def settings(state):
    ro = " readonly" if state == "submitting" else ""
    inv = state == "invalid"
    top = ""
    if inv: top = summary([("dn", "Display name can’t be empty")])
    if state == "success": top = alert("success", "Settings saved", "Your changes apply on every device you’re signed in on.")
    if state == "submitting": top = ""
    sw = lambda label, hint, on: f'<label class="switch"><input type="checkbox" role="switch"{" checked" if on else ""}><span class="choice__text">{label}<small class="text-muted">{hint}</small></span></label>'
    save = ('<button class="btn btn--primary" type="submit" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>Saving…</button>' if state == "submitting" else btn("Save changes", "primary").replace('type="button"', 'type="submit"'))
    form = (f'<form class="stack stack--lg" novalidate>{top}'
            f'<section class="card stack" aria-labelledby="s-profile"><h2 id="s-profile" style="font:var(--text-h4)">Profile</h2>'
            + field("Display name", "dn", "text", "" if inv else "Nadia", error="Display name can’t be empty" if inv else "", extra=ro, req=True)
            + field("Email", "em", "email", "nadia@example.com", help="We use this for sign-in and account emails only.", extra=ro) + '</section>'
            '<section class="card stack" aria-labelledby="s-play"><h2 id="s-play" style="font:var(--text-h4)">Playback</h2>'
            + sw("Autoplay similar tracks", "Keep playing when your queue ends.", True) + sw("Crossfade", "Blend the end of one track into the next.", False) + '</section>'
            '<section class="card stack" aria-labelledby="s-app"><h2 id="s-app" style="font:var(--text-h4)">Appearance</h2><fieldset><legend>Theme</legend>'
            '<label class="choice"><input type="radio" name="theme" checked><span class="choice__text">Match my device</span></label>'
            '<label class="choice"><input type="radio" name="theme"><span class="choice__text">Light</span></label>'
            '<label class="choice"><input type="radio" name="theme"><span class="choice__text">Dark</span></label></fieldset></section>'
            '<section class="card stack" aria-labelledby="s-n"><h2 id="s-n" style="font:var(--text-h4)">Notifications</h2>'
            + sw("New tracks from artists I follow", "At most one email a week.", True) + sw("Product news", "Rare, and never about other people’s data.", False) + '</section>'
            f'<div class="form-actions">{save}{btn("Sign out", "", "logout", href=D("sign-out"))}</div></form>')
    c = {"default": form, "invalid": form, "submitting": form, "success": form,
         "loading": '<div class="stack">' + '<div class="skeleton skeleton--rect" style="height:9rem"></div>' * 3 + '</div>', "error": err("Settings didn’t load")}
    return frame(state, "settings", "Settings", "Nadia Charles · nadia@example.com", c, player=False)


def notifications(state):
    def item(ic, text, when, unread):
        return f'<li class="notif" data-unread="{"true" if unread else "false"}">{icon(ic)}<div style="flex:1">{text}<div class="text-caption">{when}</div></div>{"<span class=\"dot\" role=\"img\" aria-label=\"Unread\"></span>" if unread else ""}</li>'
    items = [("music", f'<a href="{P("track")}">Kaiso Collective</a> released <strong>Road March Riddim</strong>.', "2 hours ago", True),
             ("user", "<strong>Mei Rodríguez</strong> shared the playlist <a href=\"" + P("playlist") + "\">Sunday kitchen</a> with you.", "Yesterday", True),
             ("heart", "<strong>Tidewater Waltz</strong> passed 25,000 plays.", "Sat 24 Oct", True),
             ("info", "Hummi now shows the model that generated each track.", "Mon 19 Oct", False)]
    lst = lambda its: '<ul class="list" style="list-style:none;padding:0">' + "".join(item(*i) for i in its) + "</ul>"
    c = {"default": lst(items), "unread": lst(items), "read": lst([(a, b, c_, False) for a, b, c_, _ in items]), "loading": skel_rows(4),
         "empty": empty("bell", "You’re all caught up", "New releases from artists you follow and playlist shares show up here.", btn("Find artists to follow", "primary", href=P("browse"))),
         "error": err("Notifications didn’t load")}
    return frame(state, "notifications", "Notifications", "3 unread" if state in ("default", "unread") else "", c, btn("Mark all as read", "", "check") if state in ("default", "unread") else "", player=False)


def licence(state):
    t = T[NOW]
    tbl = ('<div class="table-wrap"><table class="table"><caption class="visually-hidden">Licences used on Hummi</caption><thead><tr><th scope="col">Licence</th><th scope="col">You may</th><th scope="col">You must</th></tr></thead><tbody>'
           '<tr><th scope="row">Pixabay Content License</th><td>Use, change and share for free, including commercially</td><td>Nothing; credit is appreciated. Don’t sell or redistribute it unaltered on its own, or claim it as your own</td></tr></tbody></table></div>')
    terms = ('<p>Kaiso Collective shared it on Pixabay under the Pixabay Content License. You may use it for free, including commercially, and change it. Credit is not required but is appreciated: “Feathers Up by Kaiso Collective, from Pixabay.”</p>'
             '<p class="cluster"><a href="https://pixabay.com/service/license-summary/" target="_blank" rel="noopener noreferrer">Read the Pixabay Content License</a>'
             '<a href="https://pixabay.com/music/" target="_blank" rel="noopener noreferrer">View on Pixabay</a></p>')
    c = {"default": alert("info", "Feathers Up is under the Pixabay Content License", terms) + f'<section class="section"><h2 style="font:var(--text-h3);margin-bottom:var(--space-3)">Licences on Hummi</h2>{tbl}</section>'
         + f'<p><a href="{P("track")}">Back to Feathers Up</a></p>',
         "loading": '<div class="skeleton skeleton--rect" style="height:6rem"></div>' + skel_rows(3), "error": err("Licence details didn’t load")}
    return frame(state, "browse", "Licence and credit", "How you can reuse what you hear on Hummi", c, player=False)


def errpage(code, title, text, ic, actions):
    def r(state):
        return shell("", empty(ic, title, text, actions).replace('<h2 class="empty__title">', f'<p class="overline">{code}</p><h1 class="empty__title" style="font:var(--text-h2)">').replace("</h2>", "</h1>", 1), player=False)
    return r


not_found = errpage("404", "We couldn’t find that page", "The link may be old or mistyped. The track or playlist might also have been removed by its owner.", "search", btn("Go to Home", "primary", href=P("home")) + btn("Search Hummi", "", href=P("search")))
forbidden = errpage("403", "You don’t have access to this", "This playlist is private. Ask the owner to share it with you, or sign in with the account they invited.", "lock", btn("Go to Home", "primary", href=P("home")) + btn("Switch account", "", href=P("sign-in")))
server_error = errpage("500", "Something broke on our side", "We’ve been told and we’re fixing it. Nothing you saved is lost; try again in a minute.", "alert", btn("Try again", "primary", "refresh", href="default.html") + btn("Go to Home", "", href=P("home")))
offline_page = errpage("Offline", "You’re offline", "Hummi can’t reach the network. Tracks you saved on this device still play; everything else will load when you’re back.", "offline", btn("Retry", "primary", "refresh", href="default.html") + btn("Open saved tracks", "", href=P("saved")))


def saved(state):
    ids = ["feathers-up", "panyard-nights", "wine-slow"]
    c = {"default": track_list(ids, label="Saved on this device"),
         "empty": empty("music", "Nothing saved yet", "Tracks you play are kept on this device so they play offline too.", btn("Browse genres", "primary", href=P("browse")))}
    return frame(state, "", "Saved on this device", "3 tracks · the last 25 you played" if state == "default" else "0 tracks · the last 25 you played", c,
                 banner=alert("warning", "You’re offline", "Showing saved tracks. Reconnect to stream anything new.").replace('class="alert alert--warning"', 'class="alert alert--warning banner"'))


NA_STATIC = {"loading": "Static form; nothing is fetched before it is shown.", "empty": "A form has no collection that could be empty."}
NA_ERR = {"loading": "Error screen; it renders immediately.", "empty": "Error screen; it has no collection.", "error": "This screen is itself the error state."}

SCREENS = [
    dict(id="sign-in", kind="page", title="Sign in", route="/sign-in", states=["default", "invalid", "submitting", "error"], na=NA_STATIC, render=sign_in, desc="Email and password sign in"),
    dict(id="sign-up", kind="page", title="Sign up", route="/sign-up", states=["default", "invalid", "submitting", "error", "success"], na=NA_STATIC, render=sign_up, desc="Create a free account"),
    dict(id="reset-password", kind="page", title="Reset password", route="/reset-password", states=["default", "invalid", "submitting", "error", "success"], na=NA_STATIC, render=reset_password, desc="Request a password reset email"),
    dict(id="new-password", kind="page", title="New password", route="/new-password", states=["default", "invalid", "submitting", "error", "success"], na=NA_STATIC, render=new_password, desc="Choose a new password from the emailed reset link"),
    dict(id="verify-email", kind="page", title="Verify email", route="/verify-email", states=["default", "error", "success"], na={"loading": "Its default state is the loading state: it confirms the token on arrival.", "empty": "No collection."}, render=verify_email, desc="Confirms an email address from the emailed link"),
    dict(id="settings", kind="page", title="Settings", route="/settings", states=["default", "loading", "error", "invalid", "submitting", "success"], na={"empty": "Settings always have values."}, render=settings, desc="Profile, playback, appearance and notification settings"),
    dict(id="notifications", kind="page", title="Notifications", route="/notifications", states=["default", "unread", "read", "loading", "empty", "error"], render=notifications, desc="Notification centre"),
    dict(id="licence", kind="page", title="Licence and credit", route="/tracks/:id/licence", states=["default", "loading", "error"], na={"empty": "Every track has a licence."}, render=licence, desc="Licence terms and how to credit a track"),
    dict(id="not-found", kind="page", title="Not found", route="/404", states=["default"], na=NA_ERR, render=not_found, desc="404 screen"),
    dict(id="forbidden", kind="page", title="Forbidden", route="/403", states=["default"], na=NA_ERR, render=forbidden, desc="403 screen for private content"),
    dict(id="server-error", kind="page", title="Server error", route="/500", states=["default"], na=NA_ERR, render=server_error, desc="500 screen"),
    dict(id="offline", kind="page", title="Offline", route="/offline", states=["default"], na=NA_ERR, render=offline_page, desc="Offline screen"),
    dict(id="saved", kind="page", title="Saved on this device", route="/saved", states=["default", "empty"], na={"loading": "Read from this device at once.", "error": "Nothing is fetched; the list is on this device."}, render=saved, desc="Tracks kept on this device for offline listening"),
]

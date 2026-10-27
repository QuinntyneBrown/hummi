"""Dialogs and notifications. Each render(state, under) wraps the page they open from."""
from kit import *

CANCEL = btn("Cancel", "")
CANCEL_OFF = btn("Cancel", "", attrs=" disabled")


def over(under):
    return f'<div inert aria-hidden="true">{under}</div>'


def busy_btn(label, kind="primary"):
    return f'<button class="btn btn--{kind}" type="button" aria-busy="true" disabled><span class="spinner" aria-hidden="true"></span>{label}…</button>'


def failed(text):
    return alert("danger", "That didn’t work", text)


# ---------------------------------------------------------------- dialogs
def share(state, under):
    t = T[NOW]; a_ = A[t["artist"]]
    embed = state == "embed"
    copied = state == "success"
    tabs = (f'<div class="seg-tabs" role="tablist" aria-label="Share as"><button role="tab" type="button" aria-selected="{"false" if embed else "true"}">{icon("link")}Link</button>'
            f'<button role="tab" type="button" aria-selected="{"true" if embed else "false"}">{icon("code")}Embed</button></div>')
    cbtn = ('<button class="copy-btn copy-btn--done" type="button">' + icon("check") + 'Copied</button>') if copied else ('<button class="copy-btn" type="button">' + icon("copy") + 'Copy</button>')
    if embed:
        pane = (f'<div class="embed-card">{cover(a_["cover"], "sm")}<div><strong>{esc(t["title"])}</strong><small>{esc(a_["name"])} · on hummi</small></div><span class="play">{icon("play", fill=True)}</span></div>'
                '<div class="codebox"><code>&lt;iframe src="https://hummi.fm/embed/feathers-up" width="100%" height="96" frameborder="0"&gt;&lt;/iframe&gt;</code>' + cbtn + '</div>')
    else:
        pane = f'<div class="linkbox"><span>hummi.fm/t/feathers-up</span>{cbtn}</div><label class="share__start"><input type="checkbox"> Start at 1:14</label>'
    via = "".join(f'<a class="pill-btn pill-btn--lg" href="#">{icon(i)}{n}</a>' for i, n in [("message", "WhatsApp"), ("mail", "Email"), ("message", "Messages")])
    live = '<p class="visually-hidden" role="status">Link copied.</p>' if copied else ""
    dlg = (f'<div class="scrim"></div><div class="share" role="dialog" aria-modal="true" aria-labelledby="dlg-title" data-dismiss-on-escape><div class="share__panel">'
           f'<button class="ibtn share__close" type="button" aria-label="Close">{icon("close")}</button>'
           f'<div class="share__head">{cover(a_["cover"], "sm")}<div><h2 id="dlg-title">Share {esc(t["title"])}</h2><p>Free for anyone to play — no account needed.</p></div></div>'
           f'{tabs}{pane}{live}<div class="share__via"><p>Send it straight to</p><div>{via}</div></div></div></div>')
    return over(under) + dlg


def add_to_playlist(state, under):
    pls = "".join(f'<label class="choice"><input type="checkbox"{" checked" if i == 0 and state != "empty" else ""}><span class="choice__text">{n}<small>{c} tracks</small></span></label>' for i, (_, n, _, c, _) in enumerate(PLAYLISTS[:2]))
    if state == "empty":
        return over(under) + dialog_doc("Add to playlist", "You don’t have a playlist yet.", empty("library", "No playlists", "Create one and “Feathers Up” goes in it.", "").replace('class="empty"', 'class="empty empty--compact"'),
                                       CANCEL + btn("Create playlist", "primary", href="../create-playlist/default.html"), ic="plus")
    top = failed("We couldn’t save your changes. Nothing was added; try again.") if state == "failed" else ""
    foot = (CANCEL_OFF + busy_btn("Saving") if state == "busy" else CANCEL + btn("Save", "primary"))
    body = f'<fieldset {"disabled" if state == "busy" else ""}><legend>Choose playlists</legend>{pls}</fieldset><a class="btn btn--ghost" href="../create-playlist/default.html">{icon("plus")}New playlist</a>'
    return over(under) + dialog_doc("Add “Feathers Up” to a playlist", "Pick one or more. You can change this later.", body, foot, ic="plus", top_alert=top)


def create_playlist(state, under):
    rename = state == "rename"
    inv = state == "invalid"
    busy = state == "busy"
    top = failed("The playlist wasn’t saved. Your name is still here; try again.") if state == "failed" else ""
    val = "" if inv else ("Road trip to the north coast" if rename else "Rainy Sunday")
    f = (field("Playlist name", "pl-name", "text", val, help="Up to 60 characters", error="Give your playlist a name" if inv else "", extra=" readonly" if busy else "", req=True)
         + '<label class="choice"><input type="checkbox"' + (" disabled" if busy else "") + '><span class="choice__text">Make it public<small>Anyone can find and listen to it. You can change this later.</small></span></label>')
    label = "Rename" if rename else "Create"
    foot = (CANCEL_OFF + busy_btn("Saving")) if busy else CANCEL + btn(f"{label} playlist" if not rename else "Save name", "primary")
    return over(under) + dialog_doc("Rename playlist" if rename else "New playlist", "Playlists are private until you share them." if not rename else "Choose a new name for this playlist.", f, foot, ic="plus", top_alert=top)


def delete_playlist(state, under):
    top = failed("The playlist wasn’t deleted. Try again, or reload the page.") if state == "failed" else ""
    confirm = state in ("confirm", "busy", "failed")
    body = ""
    if confirm:
        body = field("Type the playlist name to confirm", "del-name", "text", "Road trip to the north coast", help="This deletes 24 tracks from the playlist, not from Hummi.", extra=" readonly" if state == "busy" else "")
    foot = (CANCEL_OFF + busy_btn("Deleting", "danger")) if state == "busy" else CANCEL + btn("Delete playlist", "danger", "trash")
    return over(under) + dialog_doc("Delete “Road trip to the north coast”?", "You can’t undo this. People you shared it with lose access.", body, foot, danger=True, ic="trash", top_alert=top)


def report_track(state, under):
    inv = state == "invalid"; busy = state == "busy"
    if state == "success":
        return over(under) + dialog_doc("Thanks, we’ll take a look", "Reports are reviewed within 2 working days. We’ll email you the outcome.", "", btn("Close", "primary"), ic="ok")
    top = failed("Your report wasn’t sent. Your answers are still here; try again.") if state == "failed" else ""
    fs = (f'<fieldset{" disabled" if busy else ""}><legend>What’s wrong?</legend>'
          + "".join(f'<label class="choice"><input type="radio" name="why"{" checked" if i == 0 and not inv else ""}{" aria-invalid=\"true\"" if inv else ""}><span class="choice__text">{t}</span></label>' for i, t in enumerate(["Copied from an artist without permission", "Wrong licence", "Harmful or hateful content", "Something else"]))
          + ('<span class="field__error" id="why-err">Choose a reason</span>' if inv else "") + '</fieldset>')
    note_f = '<label class="field"><span class="field__label">Details <span class="optional">(optional)</span></span><textarea class="textarea" rows="2"' + (" readonly" if busy else "") + '></textarea></label>'
    foot = (CANCEL_OFF + busy_btn("Sending")) if busy else CANCEL + btn("Send report", "primary")
    return over(under) + dialog_doc("Report “Feathers Up”", "Tell us what’s wrong. The artist isn’t told who reported.", fs + note_f, foot, ic="flag", top_alert=top)


def sign_in_required(state, under):
    return over(under) + dialog_doc("Sign in to save this", "Likes, playlists and your queue live in your free Hummi account.", "",
                                   btn("Not now") + btn("Create account", "", href="../../pages/sign-up/default.html") + btn("Sign in", "primary", href="../../pages/sign-in/default.html"), ic="lock")


def shortcuts(state, under):
    rows = [("Space", "Play or pause"), ("→ / ←", "Next or previous track"), ("L", "Like the current track"), ("Q", "Open the queue"), ("/", "Focus search"), ("?", "Show this list")]
    dl = '<dl class="dl">' + "".join(f"<dt><kbd>{k}</kbd></dt><dd>{v}</dd>" for k, v in rows) + "</dl>"
    return over(under) + dialog_doc("Keyboard shortcuts", "Work while the page is focused and no text field is.", dl, btn("Close", "primary"), ic="keyboard")


def sign_out(state, under):
    top = failed("We couldn’t sign you out. Check your connection and try again.") if state == "failed" else ""
    foot = (CANCEL_OFF + busy_btn("Signing out")) if state == "busy" else CANCEL + btn("Sign out", "primary", "logout")
    return over(under) + dialog_doc("Sign out of Hummi?", "Your playlists and likes stay saved. You can keep listening without an account.", "", foot, ic="logout", top_alert=top)


def account_menu_screen(state, under):
    return over(under) + account_menu(kids=state == "kids-on")


def track_menu_screen(state, under):
    pos = "bottom:6.5rem;right:7rem;transform-origin:bottom right" if state == "from-player" else "top:21rem;left:11rem"
    return over(under) + track_menu(NOW, saved=state == "saved", pos=pos)


NA_NOINPUT = {"invalid": "The dialog has no typed input to validate.", "busy": "No server call; it never waits."}
DIALOGS = [
    dict(id="share", title="Share", opens_from="track", states=["default", "success", "embed"], na=NA_NOINPUT, render=share, desc="Share link for a track or playlist"),
    dict(id="add-to-playlist", title="Add to playlist", opens_from="track", states=["default", "empty", "busy", "failed"], na={"invalid": "Only existing choices, nothing typed."}, render=add_to_playlist, desc="Choose playlists to add a track to"),
    dict(id="create-playlist", title="New playlist", opens_from="library", states=["default", "rename", "busy", "invalid", "failed"], render=create_playlist, desc="Create or rename a playlist"),
    dict(id="delete-playlist", title="Delete playlist", opens_from="playlist", states=["default", "confirm", "busy", "failed"], na={"invalid": "The confirm button stays disabled until the name matches; there is no error to show."}, render=delete_playlist, desc="Typed-confirmation delete for a playlist"),
    dict(id="report-track", title="Report track", opens_from="track", states=["default", "invalid", "busy", "failed", "success"], render=report_track, desc="Report a track for copyright, licence or safety issues"),
    dict(id="sign-in-required", title="Sign in required", opens_from="track", states=["default"], na=NA_NOINPUT, render=sign_in_required, desc="Prompt shown when a signed-out listener tries to save"),
    dict(id="shortcuts", title="Keyboard shortcuts", opens_from="home", states=["default"], na=NA_NOINPUT, render=shortcuts, desc="Reference of keyboard shortcuts"),
    dict(id="account-menu", title="Account menu", opens_from="home", states=["default", "kids-on"], na=NA_NOINPUT, render=account_menu_screen, desc="Account menu opened from the avatar"),
    dict(id="track-menu", title="Track menu", opens_from="home", states=["default", "saved", "from-player"], na=NA_NOINPUT, render=track_menu_screen, desc="Actions for one track, opened from a card, search result or the player bar"),
    dict(id="sign-out", title="Sign out", opens_from="settings", states=["default", "busy", "failed"], na={"invalid": "No typed input."}, render=sign_out, desc="Confirm signing out"),
]


# ---------------------------------------------------------------- notifications
def region(*toasts, top=False):
    cls = "toast-region toast-region--top" if top else "toast-region"
    return f'<div class="{cls}" role="status" aria-live="polite">{"".join(toasts)}</div>'


def card_toast(tone, title, text, action):
    """A toned toast card: icon, title, text, one action and Dismiss (L2-018 AC4, L2-020)."""
    role = "alert" if tone == "danger" else "status"
    ic = {"danger": "alert", "warning": "alert", "success": "check"}[tone]
    return (f'<div class="toast toast--{tone}" role="{role}">{icon(ic)}<div class="toast__body"><div class="toast__title">{title}</div>'
            f'<div class="toast__text">{text}</div><button class="toast__action" type="button">{action}</button></div>'
            f'<button class="close" type="button" aria-label="Dismiss">{icon("close", "icon--sm")}</button></div>')


def toast(state, under):
    t = {
        "play-next": toast_pill("“Road March Riddim” will play next", "road-march-riddim"),
        "info": toast_pill("Added “Road March Riddim” to your queue", "road-march-riddim"),
        "success": toast_pill("Saved “Road March Riddim” to your library", "road-march-riddim", undo=True),
        "removed": toast_pill("Removed “Road March Riddim” from your library", "road-march-riddim", undo=True),
        "album-added": toast_pill("Added Mas on the Avenue to your library", "feathers-up"),
        "downloads": toast_pill("Downloads are saved for offline listening on this device"),
        "danger": card_toast("danger", "Couldn’t like the track", "Check your connection and try again.", "Retry"),
        "added": card_toast("success", "Added to Road trip to the north coast", "“Feathers Up” is now track 25.", "Undo"),
        "duplicate": card_toast("warning", "Already in this playlist", "“Feathers Up” is in Road trip to the north coast. Add it again?", "Add again"),
        "add-failed": card_toast("danger", "Couldn’t add the track", "The connection dropped before we could save. Nothing was added.", "Retry"),
    }
    n = "Auto-dismisses after 4 s. Sits above the player bar; 24px from the bottom when no player is shown."
    return under + region(t[state]) + note(n, "bottom: 12rem; right: 1rem;")


def banner(state, under):
    kinds = {
        "info": ("info", "Scheduled maintenance", "Hummi will be read-only on Sunday 1 Nov, 02:00 to 02:30 UTC. Playback keeps working."),
        "success": ("success", "You’re back online", "Your queue and likes are up to date."),
        "warning": ("warning", "You’re offline", "Showing saved tracks. Reconnect to stream anything new."),
        "danger": ("danger", "Playback can’t start", "We can’t reach the streaming service right now. We’re on it."),
        "persistent": ("warning", "Confirm your email", "Check your inbox to keep saving playlists. <a href=\"../../pages/verify-email/default.html\">Resend the email</a>."),
    }
    k, title, text = kinds[state]
    ic = {"info": "info", "success": "ok", "warning": "alert", "danger": "alert"}[k]
    role = "alert" if k == "danger" else "status"
    b = f'<div class="alert alert--{k} banner" role="{role}">{icon(ic)}<div class="alert__body"><span><strong>{title}.</strong> {text}</span></div><button class="close" type="button" aria-label="Dismiss">{icon("close", "icon--sm")}</button></div>'
    return under.replace('<header class="topnav', b + '<header class="topnav', 1) + region()


NOTIFS = [
    dict(id="toast", title="Toast", opens_from="playlist", states=["info", "success", "play-next", "removed", "album-added", "downloads", "danger", "added", "duplicate", "add-failed"], na={"warning": "Problems are shown as banners (L2-042), inline error blocks or the danger toast."}, render=toast, desc="Transient pill confirming an action"),
    dict(id="banner", title="Banner", opens_from="home", states=["info", "success", "warning", "danger", "persistent"], render=banner, desc="Page-wide message above the top bar"),
]

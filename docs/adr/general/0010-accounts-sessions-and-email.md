# 0010. Accounts use cookie sessions, an SMTP email port and a shell-rendered sign-in prompt

Status: Accepted (2026-10-27)

## Context

Journey 07 (create an account and sign in) builds L2-027, L2-028, L2-029, L2-031 and L2-032. The designs
left the email provider, the `/api/auth` rate limits, the token lifetimes and the duplicate-email
behaviour as `<TO SUPPLY>`. They also placed the Sign out dialog in a `@hummi/settings` library and the
Sign in to save this dialog in `@hummi/components`, opened through a `DialogService` that does not exist.
L2-031 AC1 opens Sign out from Settings, which journey 13 builds; until then the mocks open it from the
account menu (`dialogs/account-menu`, L2-052). Journey 02 had already written `SessionCookies` (HttpOnly
`hm_access` and `hm_refresh` cookies) and the `SessionStore` and refresh interceptor in `@hummi/api`.

## Decision

- **Session.** Keep journey 02's cookies: a 15-minute JWT in `hm_access` and an opaque refresh token in
  `hm_refresh` (path `/api/auth`), both `HttpOnly`, `Secure`, `SameSite=Strict`. No token reaches script.
  "Keep me signed in" gives the refresh token 30 days and an expiring cookie; unchecked, it lasts one day
  on the server and the cookies end with the browser. Refresh rotates the token; sign-out revokes it and
  clears both cookies. Only SHA-256 hashes of refresh and email tokens are stored.
- **Email.** `IEmailSender` is an Application port. Production uses `SmtpEmailSender`
  (`System.Net.Mail`), configured from `Email__Smtp__Host`, `__Port`, `__UserName`, `__Password`,
  `__EnableSsl` and `Email__From` in `/opt/hummi/.env`; links use `App__BaseUrl`. Every test uses a fake.
  If the provider refuses a sign-up email, the new listener and token are deleted and the API answers 503,
  so "nothing was saved" holds (L2-027 AC5).
- **Duplicate email.** Sign-up for an address that already has an account answers the same 202 and sends
  nothing, so sign-up does not reveal who is registered.
- **Expired links.** An unknown, used or expired confirmation link answers 410 `LINK_EXPIRED` and shows
  This link has expired; Send a new link posts the same token back and the server resends for its owner
  (unless already confirmed). The signed-in banner resends for the current listener.
- **Rate limit.** `/api/auth/*` allows 20 requests a minute per client IP (`Auth__RequestsPerMinute`); the
  429 carries `Retry-After`.
- **Validation** lives in the handlers with the forms' exact messages, not FluentValidation; the client
  runs the same checks first. The clock is .NET's `TimeProvider`, faked in tests, not a new `IClock`.
- **Frontend.** A new `@hummi/accounts` library holds `/sign-up`, `/sign-in`, `/verify-email` and both
  dialogs. The auth pages set route data `bare`, so the shell drops the header, banner and footer as the
  mocks do. `SignInGate` in `@hummi/api` exposes `promptOpen`; the shell renders
  `hm-sign-in-prompt-dialog`, the same pattern as `PlayerOverlays`. Sign in and Create account carry the
  current URL as `returnUrl`; only same-app paths are honoured.
- **Account menu.** The avatar opens `hm-account-menu` (new in the design system and components library)
  with the name, email and Sign out. Kids mode, Your library, Listening history, Downloads, Share your own
  music and Settings join the menu with the journeys that build those pages. L2-031 AC1 now reads "in the
  account menu or on Settings".
- **Components.** `hm-alert` now renders the mock anatomy (icon, title, body) and a `banner` variant;
  `hm-text-field`, `hm-checkbox`, `hm-error-summary`, `hm-progress` and `hm-auth-card` were added from
  `docs/design-system/components/`; `hmButton` gained `large` and `link`.
- **Demo data.** `Hummi.Cli seed` adds the confirmed listener Nadia Charles (`nadia@hummi.fm`, password
  `hummi-demo-password`) for local installs only.

## Consequences

- Password reset (journey 08) reuses `EmailToken`, `IEmailSender`, `IAppLinks` and the rate limit.
- Saving itself (likes, follows, playlists) still belongs to journeys 09 and 10; today the gate only
  stops signed-out listeners. Create playlist will call the gate when journey 10 adds it.
- A non-credential sign-in failure shows "Sign in isn’t working right now" in the error state's danger
  alert layout; the mocks have no separate state for it.
- Check your inbox's "I’ve confirmed my email" opens Sign in rather than the verify page, because
  confirming happens from the emailed link.

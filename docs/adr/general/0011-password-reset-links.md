# 0011. Password reset uses a 1-hour email token and a separate New password page

Status: Accepted (2026-10-27)

## Context

Journey 08 (reset a forgotten password) builds L2-030. The design left the form that redeems the link as
`<TO SUPPLY>`, and no mock or requirement covered it. The design also named an `IClock` port, while ADR
0010 settled on .NET's `TimeProvider`. `EmailToken` had a single 24-hour lifetime for confirmation links.

## Decision

- **Requirement.** A new L2-055 "Choose a new password" covers the page the reset link opens, with a new
  mock `pages/new-password` (default, invalid, submitting, error, success).
- **Token.** Reset links reuse `EmailToken` with purpose `ResetPassword` (stored as the existing int
  column, so no migration). Lifetime depends on the purpose: 24 hours to confirm an email, 1 hour to reset
  a password. Requesting a new link closes the listener's open reset links. Only the SHA-256 hash is stored.
- **Request.** `POST /api/auth/password-reset` answers 202 for any well-formed request, whether or not an
  account exists; unknown addresses get no email. A provider failure answers 503 `EMAIL_UNAVAILABLE`
  ("We couldn’t send the email"), which only happens for a real account. That small signal is accepted:
  the provider failing is rare and the response is identical to an outage. An empty email answers 422.
- **Redeem.** The email links to `/new-password?token=`. `POST /api/auth/password-reset/confirm` checks
  the password (at least 10 characters, 422) before the token, so a short password does not burn the link.
  An unknown, used or expired token answers 410 `LINK_EXPIRED`. Success sets the new hash, marks the token
  used, revokes every active refresh token of the listener and answers 204. The listener is not signed in
  automatically; the page offers Sign in. Opening a reset link also confirms the email, since it proves the
  listener owns the address.
- **Clock.** `TimeProvider`, as in ADR 0010; the design's `IClock` is renamed.
- **Other failures.** A failure other than 410 or 422 on the New password page shows a danger alert
  "We couldn’t change your password" with "Try again in a minute." above the field; the mocks have no
  separate state for it.
- **Rate limit.** Both endpoints sit on `AuthController`, so the existing 20 requests a minute per IP
  applies. Nothing stricter is added (deferred by the journey prompt).

## Consequences

- The `EmailToken.Lifetime` constant becomes `EmailToken.LifetimeOf(purpose)`.
- A listener with an unconfirmed email who resets their password is confirmed as a side effect.
- Signing out everywhere also ends the session on the device that requested the reset, if any.

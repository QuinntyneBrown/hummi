# 0016. Settings live on the listener; theme and playback apply in the browser

Status: Accepted (2026-10-27)

## Context

Journey 13 builds L2-033, L2-034, L2-035 and L2-049. The designs left open whether a changed email must be
confirmed before sign-in uses it, the release digest's day and hour, the email provider, the crossfade
length and where a visitor's theme is kept. The mocks have no state for a failed save or a signed-out visit.

## Decision

- **Storage.** The settings are columns of `Listener` (`AutoplaySimilar` true, `Crossfade` false, `Theme`
  "device", `NotifyNewReleases` true, `ProductNews` false, `LastDigestAt`); migration `AddSettings` sets the
  same defaults for existing rows. `GET` and `PUT /api/me/settings` read and save them all at once, so every
  device reads the same settings when it signs in (L2-033 AC4).
- **Profile.** An empty display name answers 422 "Display name can’t be empty". A changed email must be
  unique ("That email is already in use") and is confirmed again with a fresh link, but sign-in uses it at
  once; until confirmed, the shell's banner shows as for a new account.
- **Theme.** `SettingsStore` in `@hummi/api` sets `data-theme` on the document for Light or Dark and removes
  it for Match my device, which the tokens already follow through `prefers-color-scheme`. Choosing a theme
  applies it at once; Save keeps it. A visitor's choice and the last applied theme live in `localStorage`.
  The wordmark follows `--color-logo`: coral on light, cream on dark.
- **Playback.** `PlayerStore.setPreferences` takes the switches. With Autoplay on, when the queue ends the
  current track's genre continues with its most played tracks not yet queued; off, or with none, playback
  stops. With Crossfade on, the last 6 seconds of a track fade out on its own element while the next track
  starts and fades in on a new one.
- **Notifications.** `ReleaseDigestJob` in `Hummi.Worker` runs hourly; `SendReleaseDigestsCommand` emails
  each listener with the switch on whose last digest is at least 7 days old and whose followed artists added
  tracks since, through the existing SMTP `IEmailSender`. Product news is honoured by
  `GetProductNewsRecipientsQuery`; its content and sending tool are deferred.
- **Pages.** `/settings` is in the new `@hummi/settings`. A failed save shows a danger alert "Settings
  weren’t saved"; a visitor sees "Sign in to change your settings". Sign out opens the shell's dialog through
  `AccountDialogs`. The account menu gains Your library and Settings (L2-052 AC5).
- **Components.** `hm-switch` and `hm-radio-group` join `@hummi/components`, from the design system's
  Switch and Radio group.

## Consequences

- The first digest after switching on can come within the hour, then at most weekly.
- Crossfade needs both tracks to stream at once for 6 seconds.

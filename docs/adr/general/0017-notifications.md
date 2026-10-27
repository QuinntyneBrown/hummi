# 0017. Notifications are rows per listener, made by a sweep, a link open and an announcement

Status: Accepted (2026-10-27)

## Context

Journey 14 builds L2-036 and L2-037. The design named domain events (`TrackPublished`, `PlaylistShared`,
`ProductChangeAnnounced`) that the code does not raise: tracks arrive through the seed, and sharing is a link,
not an invitation. The milestone thresholds and recipients and the unread count's refresh were `<TO SUPPLY>`.

## Decision

- **Storage.** `Notification` (listener, kind, the linked actor and item names, plays or text, created, read)
  with a `Key` unique per listener, so each fact notifies a listener once. Migration `AddNotifications`.
- **Releases and milestones.** `NotificationsJob` in `Hummi.Worker` runs `CreateDueNotificationsCommand`
  every 15 minutes: followers of an artist get "{artist} released {track}." for tracks added in the last 7
  days, and "{track} passed {n} plays." for the highest milestone a track passed. Milestones: 1,000, 10,000,
  25,000, 50,000, 100,000, 250,000, 500,000 and 1,000,000 plays; recipients are the artist's followers.
- **Shares.** When a signed-in listener opens someone else's playlist through its share link, they get
  "{owner} shared the playlist {name} with you." once, linking back with the code.
- **Product changes.** `AnnounceProductChangeCommand(key, text)` notifies every listener once per key.
  Authoring and sending it is deferred with product news (ADR 0016).
- **Endpoints.** `GET /api/me/notifications` (newest 50 and the unread count), `GET
  /api/me/notifications/unread-count` and `POST /api/me/notifications/read-all`.
- **Unread count.** `UnreadStore` in `@hummi/api` reads the count at sign-in and after every navigation; no
  polling. The header bell (`.ibtn--count` with `.badge--count`) is labelled "Notifications, {n} unread".
- **Page.** `/notifications` in the new `@hummi/notifications`, using the new `hm-notification-item`; times
  read "Just now", "{n} minutes ago", "{n} hours ago" today, "Yesterday", then "Sat 24 Oct" (with the year
  when it is not this year). Push notifications are deferred.

## Consequences

- A release is noticed up to 15 minutes late; tracks added more than 7 days before a follow do not notify.
- The seed gives Nadia one notification of each kind, three unread.

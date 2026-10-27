# 0019. Banners come from one service; render failures show Server error; dialogs make everything else inert

Status: Accepted (2026-10-27)

## Context

Journey 16 audits L2-041 to L2-048. Toasts, Not found, Forbidden, the skip link, labelled controls and tabs
already existed and had tests. Missing were the page-wide banners, the Server error page, a deleted playlist
showing Not found, and a modal background for dialogs rendered inside a page. The design left the team
alerting on logged errors as `<TO SUPPLY>`.

## Decision

- **Banners.** `BannerService` in `@hummi/api` lists the active banners and the shell renders them above
  the header as dismissible `hm-alert` banners (danger as alert, others as status): scheduled maintenance
  from `GET /api/status` (`Status:Maintenance`, for example "Sunday 1 Nov, 02:00 to 02:30 UTC"), "You’re
  offline" while the browser is offline, "You’re back online" after it reconnects, and "Playback can’t
  start" when the stream stalls while online. A dismissed banner returns when its state changes. Routes with
  their own offline message (Home, L2-002 AC3) set `data.ownOfflineMessage` and hide the offline banner. The
  email-confirmation banner stays without Dismiss until the email is confirmed.
- **Server error.** `ServerErrorHandler`, the app's `ErrorHandler`, records an uncaught error with
  `POST /api/client-errors` (logged at Error with the page's path) and shows `/server-error` without changing
  the address, so Try again reloads the page. Failed API loads keep their in-page error blocks (L2-040).
  Alerting reads the container log at Error level; wiring it to a pager is an operations concern outside the repo.
- **Not found.** A playlist that does not exist (or was deleted) shows the Not found page, like tracks,
  artists and albums.
- **Dialogs.** `hm-dialog` and `hm-share-sheet` make every sibling of themselves and of their ancestors inert
  while open (`inertBackground`), so a page's own dialog (Rename, Delete) is modal too. Escape and Close
  emit dismiss; a busy dialog ignores them and disables Cancel.
- **Toasts.** The Downloads toast of L2-041 AC4 comes with journey 17 (Listen offline), which adds downloads.

## Consequences

- Toasts are inert while a dialog is open and readable again when it closes.
- A render failure anywhere replaces the page; the address stays for a reload.

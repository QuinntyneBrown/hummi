# @hummi/settings

Angular feature library in the Hummi frontend workspace: Settings (L2-033 to L2-035, L2-049). Its lazy
route table serves `/settings`: Profile, Playback, Appearance and Notifications, saved with one call to
`PUT /api/me/settings` through `SettingsStore` in `@hummi/api`, which also applies the theme and the
Playback switches on every device (ADR 0016).

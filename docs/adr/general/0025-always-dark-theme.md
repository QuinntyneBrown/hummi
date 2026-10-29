# ADR 0025: Always dark theme for now

Status: Accepted

## Context
The app should look the same for every visitor while the light theme is not being polished. ADR 0016 lets listeners choose Light, Dark or Match my device.

## Decision
`SettingsStore.applyTheme` applies `data-theme="dark"` whatever the choice (`ALWAYS_DARK`). The Settings choice is still saved and stored, so nothing is lost. The two e2e tests that assert Light and Match my device are skipped until the flag is turned off.

## Consequences
Light and Match my device have no visible effect. Set `ALWAYS_DARK` to false and unskip the tests to restore them.

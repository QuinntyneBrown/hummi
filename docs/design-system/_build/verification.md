Run on 2026-10-27:

- `check_design_system.py docs/design-system`: 66 pages (45 components, 8 patterns), 0 errors, 0 warnings.
- `check_contrast.py tokens/tokens.css`: 134 pairs passed, 0 failed, both themes.
- `check_mocks.py docs/mocks --write`: 33 screens, 124 mocks, 0 errors, 0 warnings, with the mocks linking the system's `tokens.css` and `components.css` (the `docs/mocks/assets/tokens.css` and `ui.css` files are one-line `@import` shims for the gallery).
- Screenshots (`screenshot_mocks.py`, 360/768/1280, light and dark) were rendered for the system and the mocks; the index, Button, Player bar, Color and a mock page were reviewed by eye. The rest were not inspected one by one.

# 0002. Derive the first mock set from the brand board, not from specs

Date: 2026-10-27

## Status

Accepted

## Context

`docs/mocks/` was requested "from the Magic Patterns designs". The only Magic Patterns design for
Hummi is the logo board (see ADR 0001); it holds no screens. `docs/specs/` is empty and
`docs/journeys.md` lists only workspace setup, so there are no requirement IDs to trace.

## Decision

- The mocks take their visual language (coral, cream, plum ink, DM Sans, monoline marks) from the
  logo board and apply it in `docs/mocks/assets/tokens.css`.
- The screen inventory is derived from the product description (a free streaming platform for
  open-source AI-generated music: discover, play, share). Every assumption is listed under *Open
  questions* in `docs/mocks/README.md`.
- The mocks carry no `mock:requirements` metas until L1/L2 specs exist; the specs are then written
  against the mocks and the metas added.
- All HTML is generated from `docs/mocks/_build/`; it is never edited by hand.

## Consequences

- The set is a proposal. Specs written later may add, merge or drop screens; the generator makes
  that cheap.
- Next step is `extracting-design-systems`, which turns the mocks into `docs/design-system/`.

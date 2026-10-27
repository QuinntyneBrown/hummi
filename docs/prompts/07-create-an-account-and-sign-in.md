# Feature: Create an account and sign in

## Goal

A visitor signs up with email and password, confirms their email, signs in (optionally staying signed in) and signs out. Signed-out save attempts open the Sign in to save this dialog.

This is journey 07 of `docs/journeys.md`.

- Designs: `docs/detailed-designs/accounts/sign-up/README.md`, `docs/detailed-designs/accounts/verify-email/README.md`, `docs/detailed-designs/accounts/sign-in/README.md`, `docs/detailed-designs/accounts/sign-out/README.md`, `docs/detailed-designs/accounts/prompt-sign-in/README.md`
- Requirements: L2-027, L2-028, L2-029, L2-031, L2-032 in `docs/specs/L2.md`
- Mocks: `docs/mocks/pages/sign-up/`, `docs/mocks/pages/verify-email/`, `docs/mocks/pages/sign-in/`, `docs/mocks/dialogs/sign-out/`, `docs/mocks/dialogs/sign-in-required/`, `docs/mocks/dialogs/account-menu/`

Earlier journeys stay unchanged, except where this one extends a shared piece.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: doc alignment, component library updates, test-first implementation, estimates, green tests and a PR. Go through every phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in advance for everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR in `docs/adr/<category>/` or the design's README), and keep going.
- If a shared library, component or design asset lacks something, that is not a reason to stop. Update it first, as the repo's rules require, then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside this repo that can't be undone, such as production deploys or data changes. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Follow `AGENTS.md` exactly, especially:
  - Requirements come before code. `docs/specs/L1.md` and `docs/specs/L2.md` are the source; retired requirement numbers are never reused.
  - Backend tests in `tests/Hummi.*.Tests/` never touch a real database, Redis, blob storage or email. Use EF Core in-memory or SQLite in-memory, and fakes behind ports.
  - Playwright tests in `src/frontend/e2e/` never run the backend. Serve the built app and fake every `/api` and `/media` call with `page.route` fixtures. Use page objects in `src/frontend/e2e/pages/`.
  - Use cases are MediatR commands and queries returning `Result<T>`. Controllers map failures to ProblemDetails. Business rules live in the domain or the handler.
  - The components library is mandatory. Read the screen's entry in `docs/screen-composition.md` and build only from `@hummi/components`. If the library lacks something, update `docs/design-system/` and `src/frontend/projects/components/` first.
  - Only `src/frontend/projects/api/` calls the API. Feature libraries never import each other. Selector prefix `hm`, standalone components, signals, lazy routes.
  - Every new file lands in a folder listed in AGENTS.md "Folder structure". A new feature library is registered in `angular.json`, gets a `@hummi/<area>` path alias in `tsconfig.json`, and exports its route table from `src/public-api.ts`.
  - Change mocks only in `docs/mocks/_build/screens_*.py`, then run `python docs/mocks/_build/build.py` and `python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write`. After editing a `.puml`, run `python .claude/skills/writing-software-design-documents/scripts/render_puml.py docs/detailed-designs`.
  - Run `npm run verify` in `src/frontend` before every commit.
- Work through the phases below **in order**, using the repo skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.

## Phase 1: Align requirements, mocks and design (`engineering-requirements`, `writing-html-mocks`, `writing-software-design-documents`)
- Read every requirement listed above and its mock states. If a state the requirement needs has no mock, add it through `docs/mocks/_build/`.
- Read the designs. Resolve each `<TO SUPPLY>` with the simplest choice that fits, write the answer into the design, and record architectural choices as ADRs in `docs/adr/<category>/`.
- If a requirement is missing or wrong, update `docs/specs/L2.md` (next free number after L2-050) and keep the design tables in step.

## Phase 2: Component library (`extracting-design-systems`, `writing-screen-composition`)
- Read the `docs/screen-composition.md` entries for these screens. Add every listed component that `src/frontend/projects/components/` lacks, from `docs/design-system/components/`, with its states and tokens, before building screens.

## Phase 3: Incremental implementation (`implementing-incrementally`, test-first)
- Put screens in the `accounts` feature library (`src/frontend/projects/accounts/`, alias `@hummi/accounts`); create it if it does not exist. Shared state such as `PlayerStore` and `SessionStore` goes in `@hummi/api`.
- Plan thin vertical slices, for example:
  1. Sign up form, validation, Check your inbox, and the `IEmailSender` port with a fake in tests (L2-027)
  2. Verify email page, expiry, resend, and the confirmation banner (L2-028)
  3. Sign in with an access token plus refresh cookie, and Keep me signed in (L2-029)
  4. Sign out dialog that revokes the refresh token (L2-031)
  5. `SignInGate` and the Sign in to save this dialog (L2-032)
- For each slice:
  - Write the Given-When-Then criteria from the acceptance criteria of the cited L2 requirements.
  - Write the acceptance tests: Playwright in `src/frontend/e2e/tests/` with page objects and `page.route` fixtures, and backend tests in the matching `tests/Hummi.*.Tests/` project with in-memory fakes.
  - Run them and show that they fail for the expected reason.
  - Implement the minimum that makes them pass (domain, handler, controller, API service, screen). Refactor while green.
  - Add EF Core migrations in `Hummi.Infrastructure` for new tables. Extend `Hummi.Cli seed` with the demo data the screens need.
  - Run `npm run verify`, then commit.
- When all slices are green, refresh `docs/estimates/` (`estimating-designs`) and keep the designs and diagrams aligned with what was built.

## Deferred
- Password reset is journey 08. The email provider is `<TO SUPPLY>` in the designs: pick an SMTP adapter configured from `/opt/hummi/.env`, record an ADR, and keep tests on a fake. No social sign-in.

## Done means
- A visitor signs up with email and password, confirms their email, signs in (optionally staying signed in) and signs out. Signed-out save attempts open the Sign in to save this dialog.
- Every acceptance criterion of L2-027, L2-028, L2-029, L2-031, L2-032 has a passing test.
- All new and existing tests pass with `npm run verify` in `src/frontend`.
- Docs, designs, mocks and estimates agree with the code.
- The work is on a branch with a PR to `main`. Fetch and rebase onto `main` first, because another session may have pushed to it.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.

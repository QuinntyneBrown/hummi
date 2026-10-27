# Feature: Set up the workspace

## Goal

A developer clones the repo, runs one command and gets a building, testable .NET solution and Angular workspace with the empty application shell. The scaffold already exists under `src/backend/`, `src/frontend/` and `tests/`; this journey verifies it against `AGENTS.md` and closes any gaps.

Journey 01 of `docs/journeys.md`.

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

## Phase 1: Audit the scaffold
- Read `AGENTS.md`, `README.md`, `docs/deployment.md`, `.github/workflows/ci.yml` and the projects under `src/backend/`, `src/frontend/` and `tests/`.
- List every gap between the scaffold and AGENTS.md (folders, projects, path aliases, scripts, tests). Fix each one.

## Phase 2: Incremental implementation (`implementing-incrementally`, test-first)
- Plan thin slices, for example:
  1. `npm run verify` passes from a clean clone (restore, format, build, backend tests, lint, build:all, e2e)
  2. the architecture test enforces Api/Worker -> Application -> Domain and Infrastructure -> Application
  3. the shell e2e test (`src/frontend/e2e/tests/shell.spec.ts`) serves the built app with `page.route` fixtures only
  4. `README.md` documents the one command and the prerequisites
- For each slice: write the Given-When-Then criteria, write the failing test, show that it fails for the expected reason, make it pass, refactor while green, run `npm run verify`, then commit.

## Phase 3: Progress tracking (`estimating-designs`)
- Refresh `docs/estimates/` so it reflects the current code.

## Deferred
- Feature libraries are added by later journeys, not here.

## Done means
- A clean clone builds and tests green with `npm run verify` in `src/frontend`.
- Docs agree with the code.
- The work is on a branch with a PR to `main`. Fetch and rebase onto `main` first, because another session may have pushed to it.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.

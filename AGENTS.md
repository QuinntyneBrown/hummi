# Agent instructions for Hummi

Hummi is a free streaming platform for open-source AI-generated music: discover, play and share
tracks across every genre. The backend is .NET (ASP.NET Core, MediatR, EF Core); the frontend is
Angular. The product is defined, before code, by `docs/journeys.md`, `docs/specs/` (L1 and L2
requirements), `docs/mocks/` (generated HTML mocks), `docs/design-system/`,
`docs/detailed-designs/` and `docs/estimates/`. Architecture decisions live in `docs/adr/`.
Requirements come before code: if a feature has no spec yet, write one first
(`engineering-requirements` skill).

## Out of scope at this time (CRITICAL)

Anything listed here is **deferred and must not be looked at**: do not write specs, journeys,
mocks, designs, estimates, prompts, code or tests for it, and do not re-add references to it.
Record each deferral as an ADR in `docs/adr/general/`.

- None yet.

## Testing rules (CRITICAL)

- **Backend tests never touch a real database.** Unit, integration and architecture tests under
  `tests/Hummi.*.Tests/` use mocks, fakes or an in-memory substitute (EF Core in-memory or SQLite
  in-memory). No SQL Server, LocalDB, Testcontainers, Docker or live connection string in any test,
  fixture or CI job. The same applies to Redis, blob storage and every other external system: fake the port.
- **Playwright tests never run the backend.** Every e2e test in `src/frontend/e2e/` serves the
  Hummi API through `page.route` fixtures or an equivalent fake. No test starts, waits for, or
  calls `Hummi.Api`, `Hummi.Worker` or a database. The frontend under test is the built Angular application only.
- These rules are absolute. Do not add an opt-in flag, an "integration" tag or a separate CI lane that relaxes them.

## Folder structure (MANDATORY)

Every file you create must land in one of the folders below; never invent a parallel folder,
rename one of these, or put code outside `src/` and `tests/`. If a design seems to need a folder
that is not listed, add it to this section first and record the change as an ADR.

```
hummi/
├── AGENTS.md
├── README.md
├── .github/workflows/          ci.yml runs `npm run verify` on ubuntu-latest; deploy.yml deploys green pushes to main
├── .agents/skills/             agent skills (mirrored in .claude/skills/)
├── deploy/                     production stack: compose, Dockerfiles, Caddyfile, cloud-init
├── docs/
│   ├── journeys.md             user journeys with effort
│   ├── deployment.md           production host, deploy workflow, rollback
│   ├── screen-composition.md   which design-system components compose each screen
│   ├── responsive-design.md    responsive design best practices and how they apply to Hummi
│   ├── specs/                  L1.md and L2.md requirements
│   ├── mocks/                  generated HTML mocks (_build/ holds the Python sources)
│   ├── design-system/          tokens and components extracted from the mocks (_build/ holds the Python sources)
│   ├── detailed-designs/       {subsystem}/{feature}/README.md + diagrams/
│   ├── estimates/              README.md + one file per subsystem
│   ├── prompts/                ready-to-run implementation prompts, NN-journey.md in build order
│   └── adr/                    {category}/NNNN-title.md
├── src/
│   ├── backend/                .NET solution, namespace prefix Hummi
│   │   ├── Hummi.Api/           ASP.NET Core Web API: controllers, policies, middleware
│   │   ├── Hummi.Application/   MediatR commands, queries, validators, DTOs, ports
│   │   ├── Hummi.Domain/        entities, value objects, state machines, domain events
│   │   ├── Hummi.Infrastructure/ EF Core DbContext, repositories, adapters
│   │   ├── Hummi.Worker/        hosted background jobs
│   │   ├── Hummi.Migrator/      applies EF Core migrations
│   │   └── Hummi.Cli/           developer tool: `reset` and `seed` a local demo install
│   └── frontend/               Angular workspace (see below)
│       ├── angular.json
│       ├── package.json
│       ├── tsconfig.json       path alias @hummi/<library> per library
│       ├── eslint.config.js
│       ├── e2e/                Playwright: pages/, tests/, fixtures.ts, serve.mjs (static build server)
│       └── projects/
│           ├── hummi/          the application (projectType "application")
│           ├── api/            library: typed HTTP services, DTOs, auth state, interceptors
│           ├── components/     library: design-system components and styles
│           └── <area>/         library per feature area, added as journeys are built
└── tests/
    └── Hummi.*.Tests/          unit, integration and architecture tests per backend project
```

`Hummi.Cli` is a developer tool only: deployments and CI never run it against a database.

## Backend conventions

- Dependency direction: `Api` and `Worker` → `Application` → `Domain`; `Infrastructure` implements
  `Application` ports. `Domain` references nothing. An architecture test enforces this.
- Use cases are MediatR commands and queries returning `Result<T>`; controllers map results to
  ProblemDetails. Business rules live in the domain or the handler, never only in the client.
- Integrations (storage, email, search, payments) sit behind ports in `Application/Abstractions`
  with an adapter in `Infrastructure`.
- `npm run backend:build` builds with `-warnaserror`; `dotnet format` must be clean.

## Frontend workspace layout (MANDATORY)

The frontend is an Angular workspace: one application project and one Angular library per area,
all registered in `angular.json`.

- **One application**, `projects/hummi/`, with `src/app/` holding only `app.config.ts`,
  `app.routes.ts`, the shell components and `main.ts`/`index.html`/`styles.css`. It owns no feature screens.
- **One library per feature area**, each with `ng-package.json`, `package.json`, `README.md`,
  `tsconfig.lib.json` and `src/public-api.ts`. Code lives under `src/lib/` grouped by screen. The
  library exports its lazy route table (`export { routes } from './lib/<area>.routes';`) and nothing the app does not need.
- **`projects/api/`** is the only place that calls the Hummi API: typed services per area, DTOs,
  `provide-api.ts`, base URL, interceptors, auth and session state, shared result types. Feature
  libraries import from it; they never call `HttpClient` directly.
- **`projects/components/`** holds the design-system components extracted from `docs/design-system/`
  plus `src/styles/` tokens. Feature libraries compose screens from it and build only
  screen-specific UI locally.
- **Path aliases** in `tsconfig.json`: `@hummi/api`, `@hummi/components`, and one per feature
  library, each mapping to that library's `public-api.ts`. Import across libraries only through these aliases.
- **Dependency direction**: `hummi` → feature libraries → `api` and `components`. Feature
  libraries do not import each other; shared pieces move to `api` or `components`.
- Component selector prefix is `hm`. Standalone components, signals and lazy routes throughout.
  Prettier formats, angular-eslint lints, `npm run build:all` compiles every library and the application.

## Components library is mandatory (CRITICAL)

- The `hummi` application and every feature library MUST be built from `@hummi/components`.
  Never hand-write markup, CSS, icons, overlays or toasts the library already provides.
- `docs/screen-composition.md` is binding. Before implementing any page, dialog, notification or
  shell part, read its entry and use exactly the components it lists. Build locally only the UI it marks as local.
- If the library lacks something the entry needs, STOP. Update `docs/design-system/` and the
  library first. Do not work around it in the app.
- Change colour, type, shape or motion in the design tokens, never in components.

## Working in this repository

- Run `npm run verify` in `src/frontend` before every commit; it is the same command CI runs.
- Change mocks in `docs/mocks/_build/screens_*.py`, then run `python docs/mocks/_build/build.py`
  and `python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write`.
  Never hand-edit generated HTML, `manifest.json`, `index.html` or the coverage matrix in `docs/mocks/README.md`.
- Re-render diagrams after editing a `.puml` with
  `python .claude/skills/writing-software-design-documents/scripts/render_puml.py <dir>`.
- Keep `docs/estimates/` consistent with `docs/detailed-designs/`: one subsystem file per design
  folder, and a README whose totals are the sum of the subsystem tables.
- Record any architectural or scope decision as an ADR under `docs/adr/<category>/`.
- Retired requirement numbers are never reused.

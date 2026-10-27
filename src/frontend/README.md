# Frontend

The Angular workspace for Hummi. See [AGENTS.md](../../AGENTS.md#frontend-workspace-layout-mandatory) for the binding layout rules.

## Projects

| Project               | Kind        | Purpose                                                        |
| --------------------- | ----------- | -------------------------------------------------------------- |
| `projects/hummi`      | application | Shell, routes and app config; owns no feature screens          |
| `projects/api`        | library     | `@hummi/api`: the only code that calls the Hummi API           |
| `projects/components` | library     | `@hummi/components`: design-system components and token styles |

Feature libraries (`projects/<area>`) are added by later journeys, each with a `@hummi/<area>` alias in `tsconfig.json`.

## Commands

| Command             | Does                                                                               |
| ------------------- | ---------------------------------------------------------------------------------- |
| `npm run verify`    | Everything CI runs: backend restore, format, build and tests, lint, build:all, e2e |
| `npm start`         | Development server on http://localhost:4200, proxying `/api` and `/media`          |
| `npm run build:all` | Builds `api`, `components`, then the application                                   |
| `npm run lint`      | Prettier check and ESLint                                                          |
| `npm run format`    | Prettier write                                                                     |
| `npm run test:e2e`  | Playwright against the production build in `dist/hummi`                            |

## End-to-end tests

`e2e/serve.mjs` serves the built application; the backend never runs. `e2e/fixtures.ts` answers every
`/api` and `/media` call with a `page.route` fake: a call no test has faked gets `501` with code `NO_FAKE`,
so a missing fake fails loudly. Page objects live in `e2e/pages/`, specs in `e2e/tests/`.

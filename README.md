<h1 align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/design-system/assets/hummi-wordmark-cream.svg">
    <img src="docs/design-system/assets/hummi-wordmark-coral.svg" alt="Hummi" width="320">
  </picture>
</h1>

<p align="center"><em>Free music, made in the open.</em></p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Frontend: Angular](https://img.shields.io/badge/Frontend-Angular-dd0031.svg)](https://angular.dev)
[![Backend: .NET](https://img.shields.io/badge/Backend-.NET-512bd4.svg)](https://dotnet.microsoft.com)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)

Hummi is a free streaming platform for openly shared music. Discover, play and share tracks across every genre. The catalogue is made only of real tracks from [Pixabay Music](https://pixabay.com/music/), with their real audio, metadata and cover art, under the [Pixabay Content License](https://pixabay.com/service/license-summary/) (ADR 0021).

Hummi is a responsive web application built with [Angular](https://angular.dev) and [ASP.NET Core](https://dotnet.microsoft.com).

> [!NOTE]
> All planned product journeys are implemented. `npm run verify` passes on `main`, and every push to `main` that passes CI is deployed.

## Features

- **Real music**: every track is a real Pixabay Music track, imported with `hummi import` into a committed manifest; a cover is generated only when a track has none. The manifest lists five Pixabay track pages; none is imported yet (see [Run locally](#run-locally), step 3). The page reader is checked against real Pixabay pages.
- **Discover**: browse the home feed, genres and curated collections.
- **Play**: a persistent player with queue, seek, volume and keyboard control.
- **Search**: find tracks, artists and genres.
- **Accounts**: register, verify email, sign in and manage settings.
- **Library**: like tracks, build playlists and keep a listening history.
- **Share**: share tracks and playlists with a link.
- **Listen offline**: saved pages and audio keep working without a connection.
- **Notifications and feedback**: clear banners, dialogs and error pages.
- **Report**: flag a track for review.
- **Responsive and accessible**: light and dark themes, WCAG 2.2 AA design system.

See [docs/journeys.md](docs/journeys.md) for the full list of user journeys.

## Architecture

| Layer    | Technology                                                                                          |
| -------- | --------------------------------------------------------------------------------------------------- |
| Frontend | Angular workspace: one application, a shared `components` library, an `api` library and one library per feature area |
| Backend  | ASP.NET Core Web API, MediatR, EF Core on SQL Server, a hosted-service worker                       |
| Hosting  | Docker Compose on one Linux VM behind Caddy, deployed by GitHub Actions                             |

The backend follows Clean Architecture: `Api` and `Worker` depend on `Application`, which depends on `Domain`; `Infrastructure` implements the `Application` ports. Architecture tests enforce this. Decisions are recorded in [docs/adr/](docs/adr).

## Contents

- [Features](#features)
- [Architecture](#architecture)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Repository structure](#repository-structure)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [Security](#security)
- [Support](#support)
- [License](#license)

## Getting started

### Prerequisites

- [Git](https://git-scm.com)
- [.NET SDK](https://dotnet.microsoft.com/download) (version pinned in `src/backend/global.json`)
- [Node.js 22 LTS](https://nodejs.org) and npm
- A SQL Server instance (for example LocalDB) to run the API locally

The automated tests don't need a database. They fake every external system.

### Clone and verify

```bash
git clone https://github.com/QuinntyneBrown/hummi.git
cd hummi/src/frontend
npm ci
npx playwright install chromium
npm run verify
```

`npm run verify` is the same command CI runs. It restores, format-checks, builds and tests the backend, lints the frontend with Prettier and ESLint, builds every Angular library and the application, and runs the Playwright tests. It stops at the first failure.

### Run locally

1. Set the connection string. The API and the migrator read `ConnectionStrings__Hummi`.

   ```powershell
   $env:ConnectionStrings__Hummi = 'Server=(localdb)\MSSQLLocalDB;Database=Hummi;Trusted_Connection=True;TrustServerCertificate=True'
   ```

2. Apply the database migrations.

   ```powershell
   dotnet run --project src/backend/Hummi.Migrator
   ```

3. Import the catalogue's audio from Pixabay, then seed it. `src/backend/Hummi.Cli/Catalogue/pixabay-manifest.json` lists the Pixabay track pages (`sources`) and the imported tracks (`tracks`). `import` reads each new page, records its metadata and licence text in the manifest and downloads its MP3 to `pixabay/{id}.mp3` under `MediaStorage__RootPath` (default: a `media` folder next to the CLI); it also restores audio missing from that folder. `seed` writes exactly the manifest's tracks, plus the demo listeners, into the database. With no imported tracks the app runs with an empty catalogue.

   pixabay.com answers plain requests (and so `import` on its own) with a bot check; Hummi does not try to get past it. Save each source page from your normal browser instead (Chrome or Edge: Ctrl+S, "Webpage, HTML Only") into one folder, named by the number at the end of its address (`203465.html` for `https://pixabay.com/music/reggae-shamrock-high-times-happy-420-203465/`), plus the licence summary <https://pixabay.com/service/license-summary/> as `license-summary.html`, and pass the folder with `--pages`. The audio still downloads from `cdn.pixabay.com`.

   ```powershell
   $env:DOTNET_ENVIRONMENT = 'Development'
   dotnet run --project src/backend/Hummi.Cli -- import --manifest src/backend/Hummi.Cli/Catalogue/pixabay-manifest.json --pages C:\path\to\saved-pages
   dotnet run --project src/backend/Hummi.Cli -- seed --manifest src/backend/Hummi.Cli/Catalogue/pixabay-manifest.json
   ```

   To add tracks, add Pixabay music track page URLs to `sources`, save their pages, run `import` and commit the manifest. Audio and saved pages are never committed.

4. Start the API.

   ```powershell
   dotnet run --project src/backend/Hummi.Api --launch-profile http
   ```

5. In a second terminal, start the Angular app.

   ```powershell
   cd src/frontend
   npm start
   ```

6. Open [http://localhost:4200](http://localhost:4200). The development server proxies `/api` and `/media` to the API.

To check that the API is up, send `GET /api/health`. It returns `200`.

## Configuration

The API reads standard ASP.NET Core configuration: `appsettings.json`, `appsettings.{Environment}.json` and environment variables.

| Setting                  | Environment variable      | Description                                                                                               |
| ------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ConnectionStrings:Hummi` | `ConnectionStrings__Hummi` | SQL Server connection string. Required to run the API and the migrator.                                   |
| `Auth:SigningKey`        | `Auth__SigningKey`        | Key that signs access tokens. The development value in `appsettings.Development.json` is for local use only. |
| `MediaStorage:RootPath`  | `MediaStorage__RootPath`  | Folder holding track audio at `tracks/{trackId}.mp3` (older rows `.wav`) and the Pixabay download cache at `pixabay/{id}.mp3`. The API and `Hummi.Cli import` and `seed` use it; production mounts the media volume at `/data/media`. |
| `App:BaseUrl`            | `App__BaseUrl`            | Public URL of the frontend, used in links such as email verification.                                     |

## Testing

Run each check from `src/frontend`.

| Command                  | Runs                                                 |
| ------------------------ | ---------------------------------------------------- |
| `npm run verify`         | Every check below, in order                          |
| `npm run backend:verify` | Backend restore, format check, build and xUnit tests |
| `npm run lint`           | Prettier check and ESLint                            |
| `npm run build:all`      | Every library, then the application                  |
| `npm run test:e2e`       | Playwright (Chromium) against the production build   |

Backend tests use in-memory substitutes and never connect to a real database. Playwright tests serve the API through route fixtures and never start the backend; an `/api` or `/media` call with no fake answers `501`. Architecture tests in `tests/Hummi.Api.Tests` and `tests/Hummi.Worker.Tests` enforce the layer direction. See [AGENTS.md](AGENTS.md#testing-rules-critical) for the full rules.

## Deployment

Every push to `main` deploys once CI's `npm run verify` passes: the Deploy workflow builds the images, pushes them to GitHub Container Registry, migrates the database and restarts the Docker Compose stack on one small Linux VM. See [docs/deployment.md](docs/deployment.md).

## Repository structure

```
hummi/
├── .github/        CI and deploy workflows, issue and PR templates
├── .agents/        agent skills (mirrored in .claude/)
├── deploy/         production Docker Compose stack, Dockerfiles, Caddyfile
├── docs/           journeys, specs, mocks, design system, detailed designs, estimates, ADRs
├── src/
│   ├── backend/    .NET solution (Api, Application, Domain, Infrastructure, Worker, Migrator, Cli)
│   └── frontend/   Angular workspace (app, api, components and feature libraries, Playwright e2e)
└── tests/          backend unit, integration and architecture tests
```

## Documentation

- [AGENTS.md](AGENTS.md): working agreement for coding agents (folder structure, testing rules, conventions)
- [docs/journeys.md](docs/journeys.md): user journeys with effort
- [docs/specs/](docs/specs): L1 and L2 requirements
- [docs/design-system/](docs/design-system): tokens and components
- [docs/detailed-designs/](docs/detailed-designs): per-feature designs
- [CHANGELOG.md](CHANGELOG.md): release history
- [docs/deployment.md](docs/deployment.md): production host, deploy workflow, rollback
- [docs/adr/](docs/adr): architecture decision records

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). This project follows the [Code of Conduct](CODE_OF_CONDUCT.md).

## Security

Report vulnerabilities privately; see [SECURITY.md](SECURITY.md).

## Support

See [SUPPORT.md](SUPPORT.md).

## License

[MIT](LICENSE)

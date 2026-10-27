# Deployment

Hummi runs in production on one small Linux VM with Docker Compose, backed by a SQL database
(Azure SQL by default). Every push to `main` is deployed automatically once CI's
`npm run verify` has passed on it; there is no manual step. The setup is sized for a few users.

## Topology

| Piece      | Where                          | Notes                                                                                   |
| ---------- | ------------------------------ | --------------------------------------------------------------------------------------- |
| `web`      | VM, ports 80/443, 128 MB       | Caddy serves the Angular build, terminates TLS, proxies `/api` and `/media` to `api`    |
| `api`      | VM, internal port 8080, 512 MB | `Hummi.Api`; uploaded audio and artwork on the `media` Docker volume at `/data/media`   |
| `worker`   | VM, 384 MB                     | `Hummi.Worker`; shares the `media` volume                                               |
| `migrator` | VM, run once per deploy        | `Hummi.Migrator`; applies EF Core migrations before the restart                         |
| Database   | SQL database                   | Firewall allows only the VM's public IP                                                 |

One instance of each service, no load balancer, no staging environment. Logs use Docker's
`json-file` driver, rotated at 10 MB with 3 files kept. A deploy restarts the stack, so the
site is unavailable for a few seconds.

Everything is defined in [`deploy/`](../deploy):

- `backend.Dockerfile` builds `api`, `worker` and `migrator` from one restore (context `src/backend`).
- `web/Dockerfile` builds the Angular workspace and packages it with Caddy and `web/Caddyfile` (context: repository root).
- `docker-compose.yml` is the production stack; the deploy workflow copies it to `/opt/hummi`.
- `.env.example` lists the settings the stack needs; the real `/opt/hummi/.env` lives only on the VM.
- `cloud-init.yaml` is the VM's first-boot script (Docker, swap, `/opt/hummi`).

## Deployment workflow

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) starts when a `CI` run for a
push to `main` succeeds. A failed CI run, or a run for a pull request, deploys nothing.
Deploys queue in the `deploy-production` group and never overlap.

1. **build**: builds `hummi-api`, `hummi-worker`, `hummi-migrator` and `hummi-web` from the
   tested commit and pushes them to GitHub Container Registry, tagged with the commit SHA and `latest`.
2. **deploy** (`production` environment): over SSH, copies `docker-compose.yml`, logs in to
   GHCR, sets `IMAGE_TAG`, pulls, runs the migrator, then `docker compose up -d`. A failed
   migration stops the script before the restart, so the old containers keep serving.
3. **smoke test**: polls `https://$SITE_HOST/api/health` for up to two minutes.

Secrets, in the repository's `production` environment only:

| Secret           | Value                                         |
| ---------------- | --------------------------------------------- |
| `DEPLOY_HOST`    | Public IP of the VM                           |
| `DEPLOY_SSH_KEY` | Private key whose public half is on the VM    |
| `SITE_HOST`      | The production domain (`www.` is derived)     |

Application secrets (connection string, signing keys) live only in `/opt/hummi/.env` on the VM.

## Rolling back

- **From GitHub**: Actions → Deploy → Run workflow, with `ref` set to the full SHA of an earlier commit that passed CI.
- **On the VM**: set `IMAGE_TAG=<older-sha>` in `/opt/hummi/.env` and run `docker compose up -d`.

Migrations are forward-only. Rolling back past a migration the older code cannot read needs a new, compatible migration first.

## Operating the server

```bash
cd /opt/hummi
docker compose ps
docker compose logs -f api            # or worker, web
docker compose run --rm -T migrator   # apply migrations by hand
docker compose up -d
```

## Building from scratch

1. Create a SQL database and a Linux VM with a static public IP, using `deploy/cloud-init.yaml` as custom data. Open ports 22, 80 and 443.
2. Allow the VM's public IP through the database firewall.
3. On the VM, create `/opt/hummi/.env` from `deploy/.env.example` with real values.
4. Create an SSH key pair for deploys; add the public half to the VM user's `authorized_keys`.
5. Point the domain and its `www` host at the VM's IP.
6. In GitHub, create the `production` environment and set `DEPLOY_HOST`, `DEPLOY_SSH_KEY` and `SITE_HOST`.
7. Run the Deploy workflow once (or push to `main`).

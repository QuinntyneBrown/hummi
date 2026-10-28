# 0022. Hummi is hosted on the cheapest Azure setup that runs the stack

Status: Accepted (2026-10-28)

## Context

Hummi is a personal project with a few users, not a production service. The Deploy workflow already ships every
green push to `main` to one VM over SSH, but nothing in Azure existed to receive it, and the workflow assumed a
purchased domain with a `www.` host.

## Decision

- **Compute.** One `Standard_B2ats_v2` Ubuntu 24.04 VM (2 vCPU, 1 GB RAM plus the 2 GB swap file from
  `cloud-init.yaml`), a 30 GB Standard HDD disk and a Standard public IP. About US$10 a month in `eastus`.
- **Database.** Azure SQL Database on the free offer (serverless, 100,000 vCore seconds and 32 GB a month).
  When the allowance runs out the database pauses until the next month instead of billing.
- **Domain.** The free `hummi-<suffix>.<region>.cloudapp.azure.com` name of the public IP; Caddy gets its
  certificate. The workflow adds a `www.` host only for a real domain.
- **Provisioning.** `deploy/provision.sh` creates the resource group `hummi-rg`, the VM, the database and
  `/opt/hummi/.env`, and sets the `production` secrets. `az group delete -n hummi-rg` removes everything.
- **Email.** SMTP stays on placeholder values; sending fails quietly until a relay is configured.
- No App Service, Container Apps, staging slot, backups beyond Azure SQL's defaults, or monitoring.

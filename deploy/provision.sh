#!/usr/bin/env bash
# Creates the cheapest Azure setup for Hummi (ADR 0022) and wires it to the Deploy workflow:
# one Standard_B2ats_v2 Ubuntu VM (Docker Compose stack), an Azure SQL database on the free offer,
# and the `production` environment secrets in GitHub. Safe to re-run; existing resources are kept.
# Needs: az (logged in), gh (logged in), ssh-keygen, openssl.
# Usage: deploy/provision.sh [location]    Delete everything: az group delete -n hummi-rg
set -euo pipefail

LOCATION="${1:-eastus}"
RG=hummi-rg
VM=hummi-vm
VM_SIZE=Standard_B2ats_v2
REPO=QuinntyneBrown/hummi
SUB=$(az account show --query id -o tsv)
SUFFIX=$(printf '%s' "$SUB" | sha256sum | cut -c1-6)
DNS_LABEL="hummi-${SUFFIX}"
SQL_SERVER="hummi-sql-${SUFFIX}"
SQL_USER=hummiadmin
KEY="${HOME}/.ssh/hummi_deploy"
HERE="$(cd "$(dirname "$0")" && pwd)"

az group create -n "$RG" -l "$LOCATION" -o none

[[ -f "$KEY" ]] || ssh-keygen -t ed25519 -N "" -C hummi-deploy -f "$KEY" >/dev/null

if ! az vm show -g "$RG" -n "$VM" -o none 2>/dev/null; then
  az vm create -g "$RG" -n "$VM" -l "$LOCATION" --size "$VM_SIZE" \
    --image Ubuntu2404 --admin-username azureuser --ssh-key-values "${KEY}.pub" \
    --public-ip-sku Standard --public-ip-address-dns-name "$DNS_LABEL" \
    --os-disk-size-gb 30 --storage-sku Standard_LRS \
    --custom-data "${HERE}/cloud-init.yaml" -o none
  az vm open-port -g "$RG" -n "$VM" --port 80,443 --priority 900 -o none
fi
VM_IP=$(az vm show -d -g "$RG" -n "$VM" --query publicIps -o tsv)
SITE_HOST=$(az network public-ip show -g "$RG" -n "${VM}PublicIP" --query dnsSettings.fqdn -o tsv)

if ! az sql server show -g "$RG" -n "$SQL_SERVER" -o none 2>/dev/null; then
  SQL_PASSWORD="Hm1!$(openssl rand -hex 16)"
  az sql server create -g "$RG" -n "$SQL_SERVER" -l "$LOCATION" -u "$SQL_USER" -p "$SQL_PASSWORD" -o none
  # Free offer: 100,000 vCore seconds and 32 GB a month; pauses (never bills) when the allowance runs out.
  az sql db create -g "$RG" -s "$SQL_SERVER" -n Hummi -e GeneralPurpose -f Gen5 -c 1 \
    --compute-model Serverless --use-free-limit --free-limit-exhaustion-behavior AutoPause -o none
  az sql server firewall-rule create -g "$RG" -s "$SQL_SERVER" -n hummi-vm \
    --start-ip-address "$VM_IP" --end-ip-address "$VM_IP" -o none

  ENV_FILE=$(mktemp)
  trap 'rm -f "$ENV_FILE"' EXIT
  sed -e "s|^ConnectionStrings__Hummi=.*|ConnectionStrings__Hummi=Server=tcp:${SQL_SERVER}.database.windows.net,1433;Database=Hummi;User ID=${SQL_USER};Password=${SQL_PASSWORD};Encrypt=True;TrustServerCertificate=False;Connection Timeout=60|" \
      -e "s|^Auth__SigningKey=.*|Auth__SigningKey=$(openssl rand -hex 32)|" \
      -e "s|^Email__SigningKey=.*|Email__SigningKey=$(openssl rand -hex 32)|" \
      -e "s|^Reports__ReviewerKey=.*|Reports__ReviewerKey=$(openssl rand -hex 24)|" \
      -e "s|^App__BaseUrl=.*|App__BaseUrl=https://${SITE_HOST}|" \
      -e "s|^SITE_ADDRESS=.*|SITE_ADDRESS=${SITE_HOST}|" \
      -e "s|^CANONICAL_HOST=.*|CANONICAL_HOST=${SITE_HOST}|" \
      "${HERE}/.env.example" > "$ENV_FILE"
  SSH=(ssh -i "$KEY" -o StrictHostKeyChecking=accept-new "azureuser@${VM_IP}")
  for _ in $(seq 1 30); do "${SSH[@]}" test -d /opt/hummi 2>/dev/null && break; sleep 10; done
  "${SSH[@]}" "umask 077; cat > /opt/hummi/.env" < "$ENV_FILE"
fi

gh api -X PUT "repos/${REPO}/environments/production" >/dev/null
gh secret set DEPLOY_HOST -R "$REPO" -e production -b "$VM_IP"
gh secret set SITE_HOST -R "$REPO" -e production -b "$SITE_HOST"
gh secret set DEPLOY_SSH_KEY -R "$REPO" -e production < "$KEY"

echo "Ready: https://${SITE_HOST}  (VM ${VM_IP}). Push to main or run the Deploy workflow."
echo "For a custom domain: point it and its www. host at ${VM_IP}, then: gh secret set SITE_HOST -R ${REPO} -e production -b <domain>"

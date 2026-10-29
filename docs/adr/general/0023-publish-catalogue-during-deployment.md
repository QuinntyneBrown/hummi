# ADR 0023: Publish the manifest during deployment

Status: Accepted

## Context
Deployment applied schema migrations but left the Azure database and media volume empty. The health check did not detect this.

## Decision
The migrator publishes the committed Pixabay manifest after migrations, sharing the persistent media volume. Audio is downloaded from recorded CDN URLs and its SHA-256 verified before rows are added. Existing source URLs retain their IDs; missing audio is restored. No demo listeners or local private data are copied. Hummi.Cli remains a developer tool. Genre mapping is shared with local seeding through Application.

## Consequences
Each deployment makes the committed catalogue playable. Network or integrity failures stop deployment before restart. Audio stays outside Git. Existing accounts, playlists, plays and withdrawals survive deployment.

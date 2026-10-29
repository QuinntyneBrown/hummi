# ADR 0024: Social share metadata served by Caddy

Status: Accepted

## Context
Sharing the site link on social media showed no preview: `index.html` had no Open Graph or Twitter tags and there was no share image. Scrapers run no JavaScript and need absolute URLs, but the production host is only known at deploy time (`SITE_HOST`), not when the web image is built.

## Decision
`index.html` carries `og:*`, `twitter:*` (`summary_large_image`) and canonical tags, and points at `og-image.png` (1200x630 PNG in `projects/hummi/public/`). URLs use the placeholder `@@{.Req.Host}@@`, which Caddy's `templates` directive (delimiters `@@{` and `}@@`, matched to `/` and `/index.html` only) replaces with the requested host.

## Consequences
No build-time host and no per-environment image. Every route shares one preview because the app is client-rendered; per-track previews would need server-rendered pages and are out of scope.

# 0018. Track reports need an account; reviewers resolve them through a keyed API

Status: Accepted (2026-10-27)

## Context

Journey 15 builds L2-038. `docs/specs/L1.md` rules out in-product moderation tooling, but a report must
reach someone and its outcome must be emailed to the reporter. The design left open whether a visitor may
report, the details' maximum length and the review channel.

## Decision

- **Who reports.** Reporting needs an account, so the outcome can be emailed to the account's address:
  signed out, Report this track opens the Sign in to save this prompt. `ReportDialogs` in `@hummi/api` opens
  the dialog; the shell renders `hm-report-dialog-host` from the new `@hummi/reporting`.
- **Filing.** `POST /api/tracks/{id}/reports` with a reason (`copied`, `wrong-licence`, `harmful`, `other`)
  and optional details up to 1,000 characters ("Choose a reason", "Keep the details under 1,000
  characters"). `TrackReport` stores the reporter only to email the outcome. Migration `AddTrackReports`.
- **Anonymity.** Nothing about a track or its artist carries reports, and the reviewers' view of a report
  carries the track and the reason, never the reporter (L2-038 AC5).
- **Review channel.** Reviewers work outside the product with an HTTP client: `GET /api/reports` lists open
  reports oldest first and `POST /api/reports/{id}/resolve` (`upheld`, `outcome`) closes one, both
  authorised by the shared key in `Reports:ReviewerKey` sent as `X-Reviewer-Key` (compared in constant time;
  no key configured means 404). An upheld report withdraws the track (L2-009). Resolving emails the reporter
  the outcome through `IEmailSender`; resolving twice answers 409.
- **UI.** `hm-textarea` joins `@hummi/components` and `hm-radio-group` gains an error, from the design
  system's Textarea and Radio group.

## Consequences

- Reviewers share one key; rotating it is a deploy change.
- Withdrawing an upheld track is final until someone republishes it outside the product.

# Verified sending domain for the daily job email

## Problem

The daily digest sends through Resend without a verified domain. Broadcasts
from the shared onboarding address only reach the Resend account owner.

## Domain

The owner registered `remote-engineering-radar.me`. Its nameservers point at
Vercel DNS. The Resend sending domain is `mail.remote-engineering-radar.me`.
DNS records for that domain are created separately and are not part of this
repository change. Do not commit secrets, and do not change Vercel or GitHub
environment variables from the repository.

## Behavior

- The sender is `RESEND_FROM`, for example
  `Remote Engineering Radar <digest@mail.remote-engineering-radar.me>`.
  Public confirmation mail and the daily broadcast both use that value.
  A blank or missing `RESEND_FROM` fails the send with an error that names
  `RESEND_FROM`. Contact and segment operations still need only
  `RESEND_API_KEY` and `RESEND_SEGMENT_ID` (SPEC-034).
- Set `RESEND_FROM` as a GitHub Actions variable on the
  `production-ingestion` environment, next to `RESEND_SEGMENT_ID` and
  `SITE_URL`. The API key stays a secret. Leave `RESEND_FROM` unset in
  Vercel production.
- The radar's own signup form stays hidden in production. Subscriptions stay
  on the members area (`NEXT_PUBLIC_AREA_URL`). The form appears when
  `RESEND_FROM` is set, together with the other newsletter settings, and the
  members-area URL is unset.
- The digest sends only on the scheduled ingest cron, after that ingest
  succeeds. A manual `workflow_dispatch` does not send it, and neither does a
  push to `main`.
- `continue-on-error` stays on the digest step until the first successful
  scheduled cron after the domain is verified. The workflow TODO references
  this spec. Remove `continue-on-error` only after that run. Until then a
  missing sender or a refused broadcast fails the step on its own and does
  not fail the ingest.

## Verification

- `resendConfig` returns the trimmed `RESEND_FROM` and throws a message that
  names only the missing sending variables.
- The digest broadcast is created with that sender.
- With a focus selected, the home page shows the signup form when
  `RESEND_FROM` and the other newsletter settings are set and the members
  area URL is unset, and hides that form when `RESEND_FROM` is unset or the
  members area URL is set.

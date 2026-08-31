# SPEC-014 — Observability (access, errors, uptime)

## Goal

Know whether the production site is reachable, whether people are visiting it, and
whether the app is throwing errors — with email alerts when it is down or when Sentry
sees a high-priority issue.

Stack for this app:

| Concern                 | Tool                     | Where it lives                             |
| ----------------------- | ------------------------ | ------------------------------------------ |
| Access / traffic report | Google Analytics 4       | Client (`GA_MEASUREMENT_ID` constant)      |
| Runtime errors + alerts | Sentry                   | Client + server (`NEXT_PUBLIC_SENTRY_DSN`) |
| Uptime / “is it down?”  | UptimeRobot HTTP monitor | External (not in app code)                 |

Sentry DSN is not committed; it is set in Vercel / local `.env.local` only. The GA4
measurement id is a public client identifier and lives as a named constant.

## Acceptance

- App builds and tests pass with Sentry env vars unset (local/CI default)
- Root layout loads GA4 gtag scripts using `GA_MEASUREMENT_ID`
- Sentry initializes only when `NEXT_PUBLIC_SENTRY_DSN` is set
- `app/global-error.tsx` reports render errors to Sentry
- `.env.example` documents `NEXT_PUBLIC_SENTRY_DSN` as an empty placeholder
- UptimeRobot HTTP monitor exists for `https://remote-engineering-radar.vercel.app` (5 min, email on down)

Sentry project: `wellington-oliveira/remote-engineering-radar` (DSN already in Vercel).

## Eval commands

```bash
pnpm test
pnpm check
pnpm build
```

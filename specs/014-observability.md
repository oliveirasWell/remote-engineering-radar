# SPEC-014 — Observability (access, errors, uptime)

## Goal

Know whether the production site is reachable, whether people are visiting it, and
whether the app is throwing errors — with email alerts when it is down or when Sentry
sees a high-priority issue.

Stack for this app:

| Concern                 | Tool                     | Where it lives                             |
| ----------------------- | ------------------------ | ------------------------------------------ |
| Access / traffic report | Google Analytics 4       | Client (`NEXT_PUBLIC_GA_MEASUREMENT_ID`)   |
| Runtime errors + alerts | Sentry                   | Client + server (`NEXT_PUBLIC_SENTRY_DSN`) |
| Uptime / “is it down?”  | UptimeRobot HTTP monitor | External (not in app code)                 |

No secrets or DSNs are committed. Values are set in Vercel / local `.env.local` only.

## Acceptance

- App builds and tests pass with observability env vars unset (local/CI default)
- When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, the GA4 gtag scripts load once in the root layout
- When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset, no GA scripts are rendered
- Sentry initializes only when `NEXT_PUBLIC_SENTRY_DSN` is set
- `app/global-error.tsx` reports render errors to Sentry
- `.env.example` documents `NEXT_PUBLIC_SENTRY_DSN` and `NEXT_PUBLIC_GA_MEASUREMENT_ID` as empty placeholders
- UptimeRobot HTTP monitor exists for `https://remote-engineering-radar.vercel.app` (5 min, email on down)

## Manual follow-up (GA)

1. Create a GA4 property + web data stream for this site
2. Copy the Measurement ID (`G-…`) into Vercel as `NEXT_PUBLIC_GA_MEASUREMENT_ID` (Production + Preview)
3. Redeploy

Sentry project: `wellington-oliveira/remote-engineering-radar` (DSN already in Vercel).

## Eval commands

```bash
pnpm test
pnpm check
pnpm build
```

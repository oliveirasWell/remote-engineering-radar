# Remote Engineering Radar

Public, automated radar for remote software engineering jobs outside LinkedIn.
Focused on Senior Frontend, Fullstack, React, and React Native roles in Brazil,
LATAM, and the Americas.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL (Supabase).
GitHub Actions ingests, normalizes, deduplicates, and scores jobs; Vercel serves the
public report.

## Getting Started

Requires **Node.js 24.21+ (24.x)**, **pnpm 11.22.0**, and **Docker**.

With Docker running:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

`pnpm dev` starts the local database, applies migrations, and serves the app at
http://localhost:3000. The example environment file includes the local database URLs.

To populate the database:

```bash
pnpm ingest
```

Only remote jobs are saved. Optional settings in [`.env.example`](.env.example) let
you add Greenhouse, Ashby, and Lever boards and raise FrontendBR's GitHub API rate
limit with `GITHUB_TOKEN`.

## Commands

| Command          | Purpose                                                         |
| ---------------- | --------------------------------------------------------------- |
| `pnpm build`     | Create a production build                                       |
| `pnpm start`     | Serve the production build                                      |
| `pnpm test`      | Run unit and component tests (no Docker required)               |
| `pnpm check`     | Check formatting, lint, types, tests, and Prisma schema         |
| `pnpm quality`   | Run all checks, build, and dependency/boundary analysis         |
| `pnpm db:dev`    | Create and apply development migrations                         |
| `pnpm db:deploy` | Apply migrations using the migration/direct URL                 |
| `pnpm db:down`   | Stop the local database, keeping its data                       |
| `pnpm db:reset`  | Delete all local database data and recreate the migrated schema |
| `pnpm db:smoke`  | Test migrations in a disposable PostgreSQL container            |

See [`package.json`](package.json) for all scripts.

## Lane email alerts (optional)

The selected focus and country on the home page can be subscribed to by email.
Subscribers confirm their address before joining the Resend segment for the
language of the page they signed up on (`en` or `pt-BR`). That locale is stored
on `newsletter_subscriptions` and is what the digest reads; an unknown value is
sent in English. The scheduled ingest runs at **11:00 UTC (08:00 São Paulo)**;
after a successful scheduled ingest, it prepares each contact's job list and
sends one HTML broadcast per language, with Resend's unsubscribe link. The
digest runs only on that scheduled cron. Push to `main` and a manual
`workflow_dispatch` do not send email (SPEC-040).

Set up your **own dedicated** Resend account, verify a sending domain, and
create two segments used only by this feature: one for English
(`RESEND_SEGMENT_ID`) and one for Portuguese (`RESEND_SEGMENT_ID_PT_BR`). The
digest creates the string contact properties `daily_jobs`, `daily_jobs_html`,
and `digest_lane_url` when they are missing. The sending domain is
`mail.remote-engineering-radar.me` (`remote-engineering-radar.me` uses Vercel
DNS; the Resend records are created separately). The sender is `RESEND_FROM`,
for example `Remote Engineering Radar <digest@mail.remote-engineering-radar.me>`.
Confirmation mail and the daily broadcasts both use it. Sending fails with an
error that names `RESEND_FROM` when that variable is missing.

Configure `RESEND_API_KEY` (server-only) in Vercel, and set `SITE_URL` to the
production origin. Configure the same key as a GitHub Actions secret, and
`RESEND_FROM`, `RESEND_SEGMENT_ID`, `RESEND_SEGMENT_ID_PT_BR`, and `SITE_URL` as
GitHub Actions variables on the `production-ingestion` environment. Also set
both segment ids in Vercel so confirmation and the members API join the right
segment. Without the API key or the English segment, signups fail closed.
Without the Portuguese segment, Portuguese confirmation and any digest that
includes a `pt-BR` subscriber fail closed instead of sending English copy.

Members of the area can subscribe without the public form through the
token-protected `/api/newsletter/members` (SPEC-034). It needs only
`RESEND_API_KEY`, `RESEND_SEGMENT_ID`, and `RESEND_SEGMENT_ID_PT_BR` in Vercel.
Leave `RESEND_FROM` unset in Vercel production so the radar's own signup form
stays hidden and subscriptions stay on the area. The form appears when
`RESEND_FROM` is set, together with the other newsletter settings, and
`NEXT_PUBLIC_AREA_URL` is unset.

The [Resend Free plan](https://resend.com/pricing) currently allows 1,000 marketing contacts and broadcasts;
confirmation emails use its transactional allowance (100/day, 3,000/month).
The app caps new confirmations at 80/day. No emails are sent when there are no
new matching jobs for anyone. Each language is its own broadcast, so a language
with no matches is skipped. Inside a language that does send, a subscriber with
no matches still receives a short “no new jobs today” notice, because a
broadcast goes to the whole segment. Draft ids are recorded before sending, so
an uncertain send failure requires manual review in Resend rather than an
automatic retry that could duplicate emails.

### Beta verification before production

For a PR preview, configure `DATABASE_URL`, `RESEND_API_KEY`, `RESEND_FROM`,
`RESEND_SEGMENT_ID`, `RESEND_SEGMENT_ID_PT_BR`, and `SITE_URL` **only for the
preview branch** in Vercel. Use a separate beta database and dedicated beta
Resend segments; do not copy production credentials or subscribers. `SITE_URL` must equal the HTTPS origin
used to open the preview, or signup fails closed rather than sending a
confirmation link to production. Apply the Prisma migrations to the beta
database before testing. Test the selected lane and country with an address
you control, confirm the link, and verify its Resend contact and unsubscribe
flow. No daily broadcast is sent from PR previews; it runs only after a
successful scheduled production ingest. Keep the production GitHub Actions
secret unset until the beta flow has been verified and the PR is approved.

## Documentation

- [Specs](specs/) — feature requirements and technical decisions.
- [Prisma data layer](specs/014-prisma-data-layer.md) — production baseline,
  migration rollout, and rollback instructions.

## AdSense

The public publisher ID, the header unit, and [`public/ads.txt`](public/ads.txt)
are configured in [`lib/marketing/adsense.ts`](lib/marketing/adsense.ts). The
header unit is a responsive display ad above the site header on every page.
The home banner slot is still empty; set it there when the unit exists. Empty
slots suppress their ads in production. Preview deployments (including beta)
show a compact black labeled placeholder until a slot is configured, without
requesting that ad. A configured unit that Google marks `unfilled` collapses
to the same small dark bar instead of keeping an empty iframe. The script
loads in every environment; ad delivery still depends on Google's site
approval. Verify `/ads.txt` on the approved site.

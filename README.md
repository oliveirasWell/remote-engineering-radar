# Remote Engineering Radar

Public, automated job-intelligence report for software engineering opportunities outside
LinkedIn. Focused on Senior Frontend / Fullstack / React / React Native roles with a
preference for remote Brazil, LATAM, and Americas.

## Stack

- **Next.js** — App Router, server components, cache-friendly pages
- **React + TypeScript** — strict mode
- **PostgreSQL (Supabase Free)** — canonical job and company data
- **Prisma 7 + node-postgres** — type-safe database access and migrations
- **GitHub Actions** — scheduled ingestion (no always-on worker)
- **Vercel Hobby** — public website
- **Vitest + React Testing Library** — unit and component tests
- **Tailwind CSS v4** — utilities and theme tokens
- **ESLint + Knip + Madge** — lint zones, dead code, dependency cycles

## Requirements

- Node.js 22 (22.12 or newer)
- pnpm 11.22.0
- Docker (local Postgres runs in a container — no local install needed)

## Getting Started

```bash
pnpm install
cp .env.example .env.local
```

The copied environment file already contains the local Docker database URL. Then start
the database and the app:

```bash
pnpm db:up    # start Postgres in Docker and apply migrations
pnpm dev
```

Open http://localhost:3000.

To fill the local database with real data, run the same command the scheduled workflow
uses:

```bash
pnpm ingest
```

Hacker News "Who is Hiring", GetOnBrd, and FrontendBR need no configuration. Only
**remote** jobs are persisted; hybrid and on-site listings are skipped at ingest. Optionally
set `GITHUB_TOKEN` to raise the GitHub API rate limit for FrontendBR. Set
`GREENHOUSE_BOARD_TOKENS`, `ASHBY_BOARD_NAMES`, and `LEVER_BOARD_SLUGS` (comma-separated) in
`.env.local` to include those sources too (for example `LEVER_BOARD_SLUGS=ciandt`).

Each ingest run logs per-source `fetched` and `persisted` counts in the JSON summary.

Database data lives in the Docker named volume `radar-pgdata`, outside the repository. It
survives `pnpm db:down`; `pnpm db:reset` deletes it and starts clean.

`DATABASE_URL` must not use a `NEXT_PUBLIC_` prefix; it is the runtime application URL and
may use a pooler. `DATABASE_MIGRATION_URL` is the protected direct URL used by Prisma CLI
operations. `DIRECT_URL` is accepted as a migration fallback. Non-local runtime
connections enforce certificate verification. Prisma CLI migration connections enforce
`sslmode=require` and `sslaccept=strict`; encryption alone is not certificate verification.
Supabase hosts automatically use the bundled public `lib/db/supabase-root-ca.pem`.
Explicit nonblank `sslcert` or `sslrootcert` URL parameters select an alternative trusted
CA file; include that file in the migration environment. The PEM and the runtime CA in
`lib/db/supabase-root-ca.ts` must be updated together when rotating the public trust anchor.

Repository tests use pinned `prisma-pglite-bridge` with the production Prisma `pg` adapter,
so they remain in-process and require neither Docker nor a live database. `pnpm db:smoke`
uses a disposable PostgreSQL Docker container to verify fresh deploys and the legacy
preparation/check/resolve/deploy bridge, including data preservation. It does not use the
application database or its volume, and removes the test container on exit.

### Required production baseline gate

Production already has the application tables. Before this branch can be merged or
deployed, run this once with the protected direct Supabase migration URL:

```bash
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:baseline-check
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:resolve-baseline
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:deploy
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:status
```

Do not run `prisma migrate deploy` against the existing production database before the
resolve command succeeds. `pnpm db:deploy` performs an additional preflight and refuses to
apply the baseline when canonical tables exist without the completed baseline record.

The same operations are available in the **Ingest** workflow using the protected
`production-ingestion` environment. Run `check-baseline` first on the reviewed release
branch. Only after reviewing that read-only result and confirming a backup is available,
run `resolve-baseline` with confirmation `RESOLVE PRODUCTION BASELINE`. This validates
the existing schema again, records the baseline, and deploys pending migrations without
running ingestion. `deploy-migrations` applies pending migrations without resolving a
baseline or running ingestion. Scheduled and push-triggered runs only deploy and ingest;
they never prepare or resolve baselines. Normal `pnpm db:deploy` never adds the missing
legacy columns or resolves an existing baseline automatically.

#### Narrow legacy preparation bridge

The read-only production check in Actions run `34330899604` reported only three missing
columns: `companies.kind`, `jobs.geographies`, and `jobs.countries`. For this known legacy
state only, review the result and confirm a backup is available, then manually dispatch
**Ingest** on the reviewed release branch with operation `prepare-baseline` and the exact
confirmation `PREPARE PRODUCTION BASELINE`.

This explicit operation runs `scripts/prepare-prisma-baseline.sql` in one transaction with
a five-second lock timeout. It adds only those three columns if absent, using the legacy
`NOT NULL` defaults (`'product'` for `kind`, `'[]'::jsonb` for both location arrays), and
revokes all table privileges on `companies` and `jobs` from `anon` and `authenticated` if
those roles exist. When the migration user can act as `postgres`, it also removes that
role's global and `public`-schema default table grants to those public roles, so the
Prisma ledger is never created with public access. Rows and existing column values are
preserved. Incompatible existing columns are not repaired. Neither Drizzle migration
history nor the Prisma baseline SQL is changed.

The command then runs the full schema parity and public-role/default-privilege checks
against the same trusted migration URL. Default ACL checks cover the current migration
role and owners of Radar's application/migration tables. Defaults belonging to unrelated
provider-owned roles do not apply to Radar-created tables and are not modified. Actual
public access to Radar tables is always checked. It does **not** register the baseline, deploy
migrations, or run ingestion. SQL errors roll back the preparation transaction; a later
validation failure leaves the committed additive changes in place but fails the operation.
Stop on any failure and investigate; do not resolve or merge. A lock-timeout failure can
be retried explicitly after investigating contention, since preparation is idempotent.

Only after preparation and validation succeed, dispatch the separate `resolve-baseline`
operation with `RESOLVE PRODUCTION BASELINE`. It rechecks parity and privileges, records
the baseline, and deploys pending migrations. Continue the final merge only after that
production gate succeeds. The equivalent explicit CLI sequence, using the same protected
direct migration URL for every command, is:

```bash
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:prepare-baseline
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:resolve-baseline
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:deploy
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:status
```

Run each command only after the preceding command succeeds. Preparation is a narrow
rollout bridge, not a general schema repair command or a replacement for migrations.

The Vercel Git integration deploys independently of this workflow. For this first Prisma
rollout, complete the production baseline and migration gate **before** the final merge
to `main`. A passing local baseline check is not a production check. Future migrations
must remain backward-compatible with the running version unless deployment promotion is
explicitly gated on migration success; the ingestion workflow alone is not that gate.

Keep `drizzle.__drizzle_migrations` unchanged through the rollback window. Prisma does not
read or modify that historical table. See [SPEC-014](specs/014-prisma-data-layer.md) for the
rollout and rollback decision.

### Indexing and freshness

`SITE_URL` optionally overrides the canonical public origin; previews must not set their
own preview URL as the canonical origin. Main pages and available job details are
indexable. Substantive filter combinations have normalized self-canonicals and
`noindex,follow`; redundant defaults and invalid values resolve to the unfiltered
canonical. Locale selection remains browser-only, so no separate locale URLs or
`hreflang` variants are advertised.

`/sitemap.xml` lists all active, remote jobs within the 30-day visibility window, without
the listing page's 100-row limit. It loads a cached ID-only query at request time, so
builds do not require database access. No artificial modification dates are published.
`/robots.txt` advertises the sitemap.

Metadata and page content share the same cached read. Metadata blocks document streaming
for nonempty User-Agent requests so missing jobs and failed reads can return 404 and 500
instead of successful empty reports. Data caching is retained, but cold document requests
wait for that read. Next.js bypasses the metadata gate for missing/empty User-Agent headers;
client-navigation RSC responses also have separate transport semantics.

Only exhaustive source snapshots retire absent jobs. Rolling feeds (Hacker News,
Himalayas, and Jobicy) retain absent jobs until expiry or another explicit retirement
signal. Bounded or failed pagination is not treated as proof that a vacancy closed.

## Commands

| Command            | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| `pnpm dev`         | Start the development server                            |
| `pnpm build`       | Create a production build                               |
| `pnpm start`       | Start the production server                             |
| `pnpm lint`        | Run ESLint                                              |
| `pnpm typecheck`   | Run TypeScript without emitting files                   |
| `pnpm test`        | Run the Vitest suite                                    |
| `pnpm test:watch`  | Run Vitest in watch mode                                |
| `pnpm ingest`      | Fetch and persist jobs from configured sources          |
| `pnpm db:generate` | Generate Prisma Client without connecting to a database |
| `pnpm db:deploy`   | Safely deploy migrations using the migration/direct URL |
| `pnpm db:dev`      | Create and apply development migrations                 |
| `pnpm db:status`   | Show Prisma migration status                            |
| `pnpm db:validate` | Validate the Prisma schema without a live database      |
| `pnpm db:smoke`    | Verify fresh and legacy rollout in disposable Postgres  |

`pnpm db:baseline-check` verifies schema parity and public-role ACLs before the one-time
production baseline resolution.
`pnpm db:prepare-baseline` explicitly adds the three known missing legacy columns and
then performs that full check, without resolving or deploying migrations.
| `pnpm db:up` | Start Docker PostgreSQL and safely deploy migrations |
| `pnpm db:down` | Stop the container, keeping the data volume |
| `pnpm db:reset` | Destroy the data volume and start a fresh, migrated database |
| `pnpm check` | Run lint, typecheck, and unit tests |
| `pnpm quality` | Run check, build, dead-code, circular-dependency, and boundary checks |

## Architecture

```text
GitHub Actions (scheduled)
      → Job source adapters
      → Normalize → Deduplicate → Score
      → Supabase PostgreSQL
      → Next.js / Vercel (public report)
```

The public site primarily reads data. Crawling does not run on Vercel.

## Specs

Implementation follows eval-driven specs under [`specs/`](specs/). The current data-layer
rollout is [SPEC-014](specs/014-prisma-data-layer.md).

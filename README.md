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

Hacker News "Who is Hiring" and FrontendBR need no configuration. Optionally set
`GITHUB_TOKEN` to raise the GitHub API rate limit for FrontendBR. Set
`GREENHOUSE_BOARD_TOKENS` and `ASHBY_BOARD_NAMES` (comma-separated) in `.env.local` to
include those sources too.

Database data lives in the Docker named volume `radar-pgdata`, outside the repository. It
survives `pnpm db:down`; `pnpm db:reset` deletes it and starts clean.

`DATABASE_URL` must not use a `NEXT_PUBLIC_` prefix; it is the runtime application URL and
may use a pooler. `DATABASE_MIGRATION_URL` is the protected direct URL used by Prisma CLI
operations. `DIRECT_URL` is accepted as a migration fallback. Non-local runtime
connections enforce certificate verification; Prisma CLI migration connections require
TLS using its documented `sslmode=require` mode.

Repository tests use pinned `prisma-pglite-bridge` with the production Prisma `pg` adapter,
so they remain in-process and require neither Docker nor a live database. `pnpm db:smoke`
uses the Docker service to verify the baseline and a second idempotent deploy against real
PostgreSQL.

### Required production baseline gate

Production already has the application tables. Before this branch can be merged or
deployed, run this once with the protected direct Supabase migration URL:

```bash
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:baseline-check
DATABASE_MIGRATION_URL='postgresql://...' pnpm prisma migrate resolve --applied 20260828000000_prisma_baseline
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:deploy
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:status
```

Do not run `prisma migrate deploy` against the existing production database before the
resolve command succeeds. `pnpm db:deploy` performs an additional preflight and refuses to
apply the baseline when canonical tables exist without the completed baseline record.

Keep `drizzle.__drizzle_migrations` unchanged through the rollback window. Prisma does not
read or modify that historical table. See [SPEC-014](specs/014-prisma-data-layer.md) for the
rollout and rollback decision.

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
| `pnpm db:smoke`    | Deploy twice to a fresh real PostgreSQL smoke database  |

`pnpm db:baseline-check` verifies schema parity and public-role ACLs before the one-time
production baseline resolution.
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

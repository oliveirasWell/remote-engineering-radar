# Remote Engineering Radar

Public, automated job-intelligence report for software engineering opportunities outside
LinkedIn. Focused on Senior Frontend / Fullstack / React / React Native roles with a
preference for remote Brazil, LATAM, and Americas.

## Stack

- **Next.js** — App Router, server components, cache-friendly pages
- **React + TypeScript** — strict mode
- **PostgreSQL (Supabase Free)** — canonical job and company data
- **Drizzle ORM + postgres.js** — database access
- **GitHub Actions** — scheduled ingestion (no always-on worker)
- **Vercel Hobby** — public website
- **Vitest + React Testing Library** — unit and component tests
- **Tailwind CSS v4** — utilities and theme tokens
- **ESLint + Knip + Madge** — lint zones, dead code, dependency cycles

## Requirements

- Node.js 22
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

`DATABASE_URL` must not use a `NEXT_PUBLIC_` prefix — secrets stay server-side.
Production migrations should use a separate, protected `DATABASE_MIGRATION_URL`
secret with permissions limited to schema changes.
Repository tests use in-memory PGlite and require neither Docker nor a live database.

## Commands

| Command            | Purpose                                                               |
| ------------------ | --------------------------------------------------------------------- |
| `pnpm dev`         | Start the development server                                          |
| `pnpm build`       | Create a production build                                             |
| `pnpm start`       | Start the production server                                           |
| `pnpm lint`        | Run ESLint                                                            |
| `pnpm typecheck`   | Run TypeScript without emitting files                                 |
| `pnpm test`        | Run the Vitest suite                                                  |
| `pnpm test:watch`  | Run Vitest in watch mode                                              |
| `pnpm ingest`      | Fetch and persist jobs from configured sources                        |
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema                       |
| `pnpm db:migrate`  | Apply migrations to `DATABASE_URL`                                    |
| `pnpm db:up`       | Start the Docker Postgres container and apply migrations              |
| `pnpm db:down`     | Stop the container, keeping the data volume                           |
| `pnpm db:reset`    | Destroy the data volume and start a fresh, migrated database          |
| `pnpm check`       | Run lint, typecheck, and unit tests                                   |
| `pnpm quality`     | Run check, build, dead-code, circular-dependency, and boundary checks |

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

Implementation follows eval-driven specs under [`specs/`](specs/). Current focus:
[SPEC-013](specs/013-automated-ingestion.md).

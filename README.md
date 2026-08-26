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
- A Supabase (or compatible Postgres) connection string for local persistence work

## Getting Started

```bash
pnpm install
cp .env.example .env.local
```

Set `DATABASE_URL` in `.env.local` to your Postgres connection string, then:

```bash
pnpm db:migrate
pnpm dev
```

Open http://localhost:3000.

`DATABASE_URL` must not use a `NEXT_PUBLIC_` prefix — secrets stay server-side.
Repository tests use in-memory PGlite and do not require a live Supabase database.

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
| `pnpm ingest`      | Run the ingestion entrypoint (stub until SPEC-013)                    |
| `pnpm db:generate` | Generate SQL migrations from the Drizzle schema                       |
| `pnpm db:migrate`  | Apply migrations to `DATABASE_URL`                                    |
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
[SPEC-007](specs/007-job-scoring.md).

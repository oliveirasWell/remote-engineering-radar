# Remote Engineering Radar

Public, automated radar for remote software engineering jobs outside LinkedIn.
Focused on Senior Frontend, Fullstack, React, and React Native roles in Brazil,
LATAM, and the Americas.

## Stack

Next.js, React, TypeScript, Tailwind CSS, Prisma, and PostgreSQL (Supabase).
GitHub Actions ingests, normalizes, deduplicates, and scores jobs; Vercel serves the
public report.

## Getting Started

Requires **Node.js 22.12+ (22.x)**, **pnpm 11.22.0**, and **Docker**.

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

[Vagas Remotas](https://vagasremotas.com.br/) is enabled by default through its
public WordPress API. Ingestion reads up to 500 listings from the programming
category per run, keeping published, unfilled jobs marked as remote and preserving
their stated locations. No API key is required.

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

## Documentation

- [Specs](specs/) — feature requirements and technical decisions.
- [Prisma data layer](specs/014-prisma-data-layer.md) — production baseline,
  migration rollout, and rollback instructions.

# Remote Engineering Radar

Public, automated radar for remote senior tech jobs and the companies hiring for
them, built from public job boards and updated daily. Focused on Brazil, LATAM,
and the Americas, in English and Portuguese.

## What it does

- **Four tracks.** React Engineering (React, TypeScript, Node.js, GraphQL, React
  Native), Cloud & Ops, Product, and Data Annotation. React Engineering only
  holds jobs with a software signal; everything else stays under "All roles".
- **Country filters by eligibility.** A country tab also lists the regions that
  include it: Brazil shows Brazil, LATAM, and worldwide jobs. Countries come
  only from each posting's stated restrictions, never from its description.
- **Portuguese-aware classification.** Seniority, work model, and tracks are
  read from English and Portuguese postings (`lib/classification/vocabulary`).
  Benefit phrases such as "auxílio home office" do not count as remote.
- **Two languages, two URLs.** English at `/`, Portuguese at `/pt-BR`, both
  rendered on the server with `hreflang` alternates. The language picker keeps
  the current page and filters.
- **Search-ready views.** Each single country or track view with enough jobs is
  indexed with its own title and listed in the sitemap.

Sources: Himalayas, Jobicy, GetOnBrd, Hacker News "Who is hiring?", Y
Combinator's Work at a Startup, the frontendbr and quavedev GitHub boards, and
any Greenhouse, Ashby, or Lever boards you configure.

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

### Maintenance scripts

Run with `pnpm dlx tsx --conditions=react-server scripts/<name>.ts` and a
`DATABASE_URL`.

| Script                      | Purpose                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------- |
| `replay-classification.ts`  | Snapshot classifier results, then diff them after a change (`--snapshot`/`--compare`) |
| `reclassify-active-jobs.ts` | Reclassify stored jobs with the current classifier (`--dry-run --audit <file>` first) |

## Documentation

- [Specs](specs/) — feature requirements and technical decisions.
- [Prisma data layer](specs/014-prisma-data-layer.md) — production baseline,
  migration rollout, and rollback instructions.

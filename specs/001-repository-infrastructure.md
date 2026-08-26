# SPEC-001 — Repository and infrastructure

## Goal

Create the basic Remote Engineering Radar repository shell. No business logic.

## Acceptance

- Next.js application starts
- TypeScript strict mode enabled
- Test framework configured (Vitest)
- Linting configured
- Environment variables documented
- Database connection abstraction exists (Drizzle + postgres.js; no schema yet)
- GitHub Actions workflows exist (CI + scheduled ingest stub)
- Application runs locally

## Eval commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm quality
```

## Out of scope

Schema, migrations, repositories, source adapters, scoring, public report UI beyond a
static brand shell, real ingestion.

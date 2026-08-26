# SPEC-002 — Job domain model

## Goal

Implement domain types, database schema, migrations, and repositories for companies,
jobs, and hiring signals.

## Acceptance

- Schema can be created from scratch via migrations
- CRUD repository tests pass
- No source-specific fields leak into domain models

## Eval commands

```bash
pnpm db:generate
pnpm test
pnpm check
pnpm build
```

## Out of scope

Source adapters, scoring, public report UI, real ingestion.

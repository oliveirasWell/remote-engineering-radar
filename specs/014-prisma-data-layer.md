# SPEC-014 - Prisma data layer

## Status

Accepted for implementation. Production rollout is blocked on the baseline gate below.

## Context

The application previously used Drizzle and postgres.js. Production already contains the
canonical tables, so treating the Prisma baseline as a new migration would attempt to
create existing objects. Runtime and migration credentials also have different privilege
and pooling requirements.

## Decision

- Use exactly Prisma `7.10.0` for `prisma`, `@prisma/client`, and
  `@prisma/adapter-pg`, with `pg` `8.16.3` and `@types/pg` `8.16.0`.
- Use `DATABASE_URL` only for application runtime access. Prisma CLI commands prefer
  `DATABASE_MIGRATION_URL`, then `DIRECT_URL`, then local `DATABASE_URL`.
- Construct Prisma lazily with the official `pg` adapter. Non-local runtime hosts use
  certificate verification, while the Prisma CLI uses its documented `sslmode=require`
  mode. The pool has explicit connection, idle, query, and size limits.
- Keep domain models independent of Prisma. Repository factories accept both a root
  client and Prisma interactive transaction clients. Ingestion owns one outer interactive
  transaction; signal replacement reuses it rather than attempting a nested transaction.
- Use the pinned `prisma-pglite-bridge` `1.8.0` for deterministic in-process tests. It is
  actively maintained, declares Prisma 7/PGlite 0.5/Vitest 4 compatibility, and runs the
  same `pg 8.16.3` and official adapter path as production. Tests apply committed migration
  SQL, so the bridge's separately versioned schema-engine helper is not used. If this
  compatibility ceases to hold, move database tests to the existing Docker PostgreSQL
  service rather than adding an unverified adapter.

## Physical Schema

`prisma/schema.prisma` maps the existing `companies`, `jobs`, and `hiring_signals` tables
and snake-case columns. UUIDs retain database-side `gen_random_uuid()` defaults; dates use
`TIMESTAMPTZ(6)`; technologies remain JSONB; all existing unique, foreign-key, and index
names are retained. Both foreign keys use `ON DELETE NO ACTION ON UPDATE NO ACTION`.

The complete empty-database baseline is `20260828000000_prisma_baseline`. The following
`20260828001000_lock_prisma_metadata` migration revokes public access from both the
application tables and Prisma's migration metadata. Default-privilege changes for the
`postgres` role run only when the migration user can assume that role.

## Production Gate

Before this change can be merged or deployed, an operator must run the following once
against the existing Supabase database using its protected direct migration URL:

```bash
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:baseline-check
DATABASE_MIGRATION_URL='postgresql://...' pnpm prisma migrate resolve --applied 20260828000000_prisma_baseline
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:deploy
DATABASE_MIGRATION_URL='postgresql://...' pnpm db:status
```

Only after both commands succeed may `pnpm db:deploy` run. The deploy wrapper refuses to
continue when any canonical application table exists without a completed baseline record.
This prevents the scheduled workflow from accidentally applying the baseline to the
existing schema.

Do not drop or alter `drizzle.__drizzle_migrations`. It is not used by Prisma, but must be
retained through the rollback window so the previous release can still inspect its own
migration history. Removing it is a separate post-rollback-window operation.

## Rollback

Roll back application code and credentials without reverting the Prisma baseline record or
changing application data. The physical schema is unchanged and the retained Drizzle
migration history permits the prior data layer to run. Do not use `migrate reset` in any
shared or production environment.

## Verification

Prisma `7.10.0` pins vulnerable `deepmerge-ts 7.1.5` through `@prisma/config`.
The workspace overrides it with patched `8.0.0`; generation, validation, migration deploy,
schema diff, and the full quality gate must remain part of upgrades until Prisma ships the
patched dependency directly.

```bash
pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:validate
pnpm db:baseline-check
pnpm test
pnpm quality
pnpm db:smoke
pnpm audit --prod
```

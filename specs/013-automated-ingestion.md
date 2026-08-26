# SPEC-013 — Automated ingestion

## Goal

Connect source adapters to a scheduled GitHub Actions ingestion pipeline.

## Acceptance

- Scheduled workflow runs
- One failed source does not prevent other sources
- Duplicate execution is idempotent
- Database remains consistent
- Logs identify source failures
- Workflow / ingestion tests pass

## Eval commands

```bash
pnpm test
pnpm check
pnpm ingest
```

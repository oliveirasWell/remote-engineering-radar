# SPEC-011 — Jobs page

## Goal

List all active relevant jobs with filters and score ordering.

## Acceptance

- All relevant jobs displayed
- Filters work (technology, seniority, remote, location, minimum score)
- Score ordering works
- Stale/inactive jobs are handled correctly
- Job detail page at `/jobs/[id]`

## Eval commands

```bash
pnpm test
pnpm check
pnpm build
```

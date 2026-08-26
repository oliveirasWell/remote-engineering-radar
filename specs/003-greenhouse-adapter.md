# SPEC-003 — Greenhouse adapter

## Goal

Implement the Greenhouse job board source adapter behind the shared `JobSource`
interface.

## Acceptance

- Fetch realistic fixture responses
- Normalize jobs to the canonical `NormalizedJob` shape
- Handle pagination
- Handle missing fields
- Handle malformed records gracefully
- Tests cover successful and failure cases

## Eval commands

```bash
pnpm test
pnpm check
```

## Out of scope

Ashby, Hacker News, scoring, persistence wiring, other sources.

# SPEC-007 — Job scoring

## Goal

Implement the deterministic scoring algorithm with explainable reasons.

## Acceptance

- Score is deterministic
- Reasons are returned
- High-fit jobs rank above weak-fit jobs
- Rejected roles cannot accidentally receive high scores
- Scoring rules are unit tested

## Eval commands

```bash
pnpm test
pnpm check
```

## Out of scope

Deduplication, hiring signals, UI, ingestion wiring.

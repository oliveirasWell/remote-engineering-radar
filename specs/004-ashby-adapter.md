# SPEC-004 — Ashby adapter

## Goal

Implement the Ashby job board source adapter behind the shared `JobSource`
interface.

## Acceptance

- Fetch realistic fixture responses
- Normalize jobs to the canonical `NormalizedJob` shape
- Handle cursor pagination when present
- Handle missing fields
- Handle malformed / unlisted records gracefully
- Tests cover successful and failure cases

## Eval commands

```bash
pnpm test
pnpm check
```

## Out of scope

Hacker News, scoring, persistence wiring, additional sources.

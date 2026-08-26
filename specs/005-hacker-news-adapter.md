# SPEC-005 — Hacker News adapter

## Goal

Parse the HN “Who Is Hiring” thread into canonical `NormalizedJob` records.

## Acceptance

- Extract company, role, description, location, remote information, and URL when available
- Tests use representative fixtures
- Gracefully skip malformed comments

## Eval commands

```bash
pnpm test
pnpm check
```

## Out of scope

Scoring, persistence wiring, additional sources.

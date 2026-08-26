# SPEC-006 — Job relevance classifier

## Goal

Deterministically extract technologies, seniority, and location/remote signals
from normalized job text.

## Acceptance

Classify correctly at least:

1. Senior React + TypeScript
2. Senior React + Node + GraphQL
3. Senior React Native
4. Mid-level React
5. Junior React
6. Senior unrelated backend role
7. Remote React LATAM
8. On-site React
9. React Native + Expo
10. TypeScript + Node + GraphQL fullstack

## Eval commands

```bash
pnpm test
pnpm check
```

## Out of scope

Numeric scoring (SPEC-007), persistence, UI.

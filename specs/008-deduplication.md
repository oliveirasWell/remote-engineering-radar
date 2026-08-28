# SPEC-008 — Deduplication

## Goal

Avoid presenting duplicate jobs across and within sources.

## Acceptance

- Exact duplicate (same source + sourceJobId) is merged
- Cross-source duplicate is detected when evidence is strong
- Unrelated jobs are not merged
- Canonical URL is preserved
- If uncertain, preserve records rather than merging

## Eval commands

```bash
pnpm test
pnpm check
```

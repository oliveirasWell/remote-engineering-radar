# Himalayas as the source of last resort

## Problem

On 30 Sep 2026, 29,380 of the active jobs came from Himalayas, an aggregator
that reposts other boards. Its copies are often older and compete worldwide,
and an aggregator copy was only retired when a verified Greenhouse, Ashby or
Lever board listed the same role.

## Behavior

- `scripts/ingest.ts` lists Himalayas last. In-run dedupe keeps the first
  copy it sees, so any other source wins over Himalayas for the same role.
- After each run, `deactivateHimalayasTwins` retires an active Himalayas job
  when any other source lists an active job for the same company with the
  same normalized title (the normalization `deactivateAggregatorTwins` uses).
  A title Himalayas lists more than once for a company stays, because a title
  alone cannot tell those openings apart.
- Jobicy keeps the stricter rule: only a verified direct board retires it.

## Measuring it

The per-source ingest metrics from PR #97 (`pnpm metrics:sources`, in the ingest job
summary) report each source's active jobs and the share not on Himalayas.
After a week, compare Himalayas' kept and active jobs before and after.

## Known debt

- Same-company, same-title matching misses a role retitled by the other
  source; requisition ids are not shared across sources.

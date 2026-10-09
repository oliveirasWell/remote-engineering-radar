# SPEC-024 — ATS board discovery

**Status: open.** Builds on [SPEC-003](003-greenhouse-adapter.md),
[SPEC-004](004-ashby-adapter.md), [SPEC-008](008-deduplication.md), and
[SPEC-013](013-automated-ingestion.md). Independent of SPEC-017 and SPEC-023.

## Problem

The radar is one source wide. Measured on 2026-09-30:

| Source            | Active jobs |
| ----------------- | ----------- |
| Himalayas         | 29 380      |
| Jobicy            | 338         |
| Hacker News       | 127         |
| Greenhouse        | 112         |
| YC                | 70          |
| Ashby             | 60          |
| Get on Board      | 58          |
| Quave, FrontendBR | 4           |

The Greenhouse, Ashby, and Lever adapters already exist, but they read a short
hand-kept list from GitHub secrets (`GREENHOUSE_BOARD_TOKENS`, `ASHBY_BOARD_NAMES`,
`LEVER_BOARD_SLUGS`). Only ~12 boards appear in the data against a cap of 100 per
ATS (`MAX_CONFIGURED_BOARDS` in [scripts/ingest.ts](../scripts/ingest.ts)). Nobody
can read or review the list.

The companies are already in the database. A probe of the top 60 Himalayas
companies by active `software` jobs, with a slug derived from the company name,
found a public board for **11 (~18 %)**, each with 100–1 400 jobs: Canonical,
Nebius, Samsara, Grafana Labs, Twilio, Sezzle, Oscar (Greenhouse); Mercor, Clera
(Ashby); Bluelight Consulting, Xsolla (Lever). 8 540 companies have active jobs.

Three things block simply adding those boards:

1. **Duplicates.** Himalayas job URLs are `himalayas.app/...`. `strongCrossSourceKey`
   in [lib/deduplication/deduplicate-jobs.ts](../lib/deduplication/deduplicate-jobs.ts)
   keys on company + title + application URL, so a Himalayas job and the same job
   from the company's own board never merge. Two cards.
2. **All-or-nothing sources.** Each multi-board adapter walks its boards in a
   `for` loop and throws on the first failure
   ([greenhouse-adapter.ts](../lib/sources/greenhouse/greenhouse-adapter.ts)
   `fetchJobs`; Ashby and Lever are the same). One renamed slug zeroes the whole
   source for the day. More boards make that likely.
3. **Homonyms.** A slug from a name is a guess. `oscar` exists; whether it is the
   Oscar we hold is a separate question.

Budget: the database is 149 MB of the 500 MB free tier, and the ingest run takes
~2.5 min of its 20 min timeout. Both have room for this; neither has room for
unbounded discovery.

## Decision

- Board lists are **versioned code**, not secrets. Slugs are public.
- Discovery runs **automatically in the daily ingest**, bounded by a time budget, and
  writes the boards it verifies to a table.
- When a company has a direct board, **the direct job wins** over the aggregator
  copy. Verified seed boards also retain a company association, so a board slug
  that differs from the company name still maps to the right company.

```
ingest:  sources (seed ∪ verified boards) → enrich → dedupe → persist
         → deactivate aggregator twins → discover boards until the budget runs out
```

## Step 0 — carry the current lists over (manual)

GitHub secrets cannot be read back. Before the first PR, copy the current values of
`GREENHOUSE_BOARD_TOKENS`, `ASHBY_BOARD_NAMES`, and `LEVER_BOARD_SLUGS` (from
`.env.local` or wherever they were set) into the constants in Part 1. Delete the
three secrets after Part 1 is deployed.

## Part 1 — Versioned seed list

- Add `GREENHOUSE_BOARD_TOKENS`, `ASHBY_BOARD_NAMES`, `LEVER_BOARD_SLUGS` as
  `readonly string[]` to each module's existing `constants.ts`.
- Delete `splitList` and the three env reads from `scripts/ingest.ts`; read the
  constants. Keep the `MAX_CONFIGURED_BOARDS` guard, applied to the fetch set in
  Part 4.
- `scripts/replay-classification.ts` reads `GREENHOUSE_BOARD_TOKENS` from env; read
  the constant instead.
- Remove the three variables from `.github/workflows/ingest.yml` and `.env.example`.
- The About copy in `lib/i18n/messages.ts` (EN and pt-BR) names the env variables.
  Reword it to “public boards of companies on the radar”, without the variable name.

## Part 2 — Per-board failure isolation

Lands before discovery.

- Each adapter fetches every board independently. A board that throws is logged and
  skipped; the other boards' jobs are still returned.
- If any board failed, the source returns `complete: false`, so
  `deactivateMissingBySource` does not retire the jobs of a board that only failed
  to answer today. When every board succeeded, `complete` stays `true`.
- Return the failed boards (name and status) in the source result so
  `scripts/ingest.ts` reports each to Sentry through `reportIngestionSourceFailures`,
  with the board in the message (`Source greenhouse board canonical failed: 404`).
- `fetchWithRetry` in [lib/sources/fetch-json.ts](../lib/sources/fetch-json.ts) is
  unchanged.

## Part 3 — Discovered boards table

One migration:

- New Prisma model `AtsBoard`, table `ats_boards`, holding only verified boards
  (including verified seed boards):
  `id` (uuid), `ats` (text: `greenhouse` | `ashby` | `lever`), `slug` (text),
  `companyId` (uuid → `companies`). Unique on (`ats`, `slug`).
- New column `companies.board_checked_at` (timestamptz, nullable): when discovery
  last probed the company, hit or not.

Inserts use `ON CONFLICT (ats, slug) DO NOTHING`, so a probe that finds an
already verified board adds nothing. A seed board is associated with a company
on its first verified probe, but is never fetched twice. The repository goes in
`lib/db/repositories/`, next to the others.

## Part 4 — Discovery in the ingest

New folder `lib/sources/board-discovery/`: `constants.ts`,
`build-slug-candidates.ts`, `discover-boards.ts`, and their tests. It runs at the
end of `runIngestion`, after persistence.

**Constants**

- `BOARD_DISCOVERY_BUDGET_MS = 180_000`
- `BOARD_PROBE_DELAY_MS = 150` between requests
- `BOARD_RECHECK_DAYS = 30`

**Candidates.** Companies with active jobs whose `roleFocus` contains `software`,
ranked by that count, with an active Himalayas or Jobicy software job for
verification, whose `board_checked_at` is null or older than
`BOARD_RECHECK_DAYS`.

**Slugs.** `buildSlugCandidates(name)` is pure and returns, deduplicated, in order:

1. lowercase, letters and digits only (`grafanalabs`)
2. the same after removing legal and generic words: inc, llc, ltd, gmbh, pvt, pty,
   corp, corporation, group, technologies, technology, solutions, consulting,
   international, labs (`grafana`)

**Probe.** For each candidate, try Greenhouse, then Ashby, then Lever, using each
adapter's existing URL builder and base URL constant. An unrelated board is a
homonym, not a verified hit: continue through the other slugs and ATS vendors.
Stop only when a board has a matching title.

**Homonym guard.** A hit is stored only when at least one board job title,
normalized with `normalizeJobTitle`, equals the normalized title of an active
Himalayas or Jobicy software job we already hold for that company. A board's
existing jobs cannot verify its own slug; this also keeps another company's
`oscar` board off Oscar. Set `board_checked_at = now()` for a verified hit or a
conclusive miss (including 404). If any probe had a transient failure or the
budget expired mid-company, leave the timestamp null or stale so the company
remains pending for the next ingest. No separate pending column is needed.

**Budget.** Probe companies in order until `BOARD_DISCOVERY_BUDGET_MS` runs out.
Discovery never fails the ingest: errors are logged, and the run result is
unchanged. Log `Board discovery: checked N companies, verified M boards`.

## Part 5 — Fetch set

Boards fetched per ATS = the seed constants, then the `ats_boards` rows ordered by
their company's active `software` job count (descending, computed in the query that
builds the list). Verified seed rows supply the canonical company name without
adding a duplicate fetch. Verified non-seed boards also use the canonical company
name. The total is capped at `MAX_CONFIGURED_BOARDS` per ATS.

A discovered board that answers 404 is deleted from `ats_boards`. Its company is
probed again once `BOARD_RECHECK_DAYS` have passed. Other failures are only skipped
for the day (Part 2).

## Part 6 — Direct board wins over the aggregator

Himalayas URLs never match a company's own application URL, so `deduplicateJobs`
cannot merge the pair. Himalayas rows stored before a board was discovered are also
never re-fetched, because the feed only reaches back ~2 days. One step covers both:

- During persistence, before hiring signals are recalculated, a jobs-repository
  method deactivates active rows from
  `AGGREGATOR_SOURCES = ['himalayas', 'jobicy']` only when exactly one active
  aggregator row and one active Greenhouse, Ashby, or Lever row share a canonical
  company ID and normalized title (`normalizeJobTitle`), and that ATS has a
  verified company association. Keep both source constants in the repository.
  Ambiguous same-title groups and matches from other feeds remain active until
  a stronger shared requisition ID is available.
- `deduplicateJobs` is unchanged.

## Acceptance

RED → GREEN → REFACTOR, one part per PR, in order 1 → 6.

- `buildSlugCandidates('Grafana Labs')` returns `grafanalabs` and `grafana`.
- A probe whose board lists a title we hold for the company stores the board.
- A probe whose board lists only unrelated titles stores nothing.
- An unrelated homonym board does not prevent a later slug or ATS from being
  verified.
- 404 on all three ATS stores nothing.
- Conclusive probes set `board_checked_at`. A company checked less than 30 days
  ago is not probed; an older one is. Transient failures stay pending and are
  eligible on the next ingest.
- A probe that finds a seed board stores its verified company association once;
  a known board inserts nothing and does not throw.
- Discovery stops at `BOARD_DISCOVERY_BUDGET_MS`, and a throwing probe does not fail
  `runIngestion`.
- With one failing board among three, the adapter returns the other two boards' jobs
  and `complete: false`; with none failing, `complete: true`.
- A discovered board that answers 404 is deleted from `ats_boards`.
- The fetch set never exceeds `MAX_CONFIGURED_BOARDS` per ATS, and seed boards come
  first.
- After ingest, a one-to-one active Himalayas/verified Greenhouse match by
  company and title retires the Himalayas row. Same-title requisitions with
  multiple aggregator or ATS rows, and matches from non-ATS feeds, remain active.
- `scripts/ingest.ts` and the workflow no longer read board env variables.

`pnpm test` and `pnpm check` stay green. After deploy, run a manual
`workflow_dispatch` ingest: it finishes under the 20 min timeout, and the log shows
the board discovery line.

## Eval commands

```bash
pnpm check
pnpm db:up && pnpm db:deploy && pnpm ingest
```

## Out of scope

Himalayas 429 hardening and a Himalayas keyword pass, Mobile lane rule changes,
the Remote OK source (SPEC-017), purging inactive rows, and ATS vendors other than
Greenhouse, Ashby, and Lever (Workable, SmartRecruiters, Recruitee).

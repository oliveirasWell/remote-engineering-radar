# SPEC-016 — Cloud & Ops as a second tracked focus

**Status: shipped.** This spec documents behavior that is implemented and green, so a
future change knows which parts are load-bearing. It supersedes parts of
[SPEC-015](015-technology-prominence-and-egress.md) Part 1 — see the note there.

## Problem

A reader asked for Cloud and Ops vacancies. They were not missing by accident: the
classifier rejected them at ingest, before insert.

```ts
// lib/classification/constants.ts, before this spec
export const UNRELATED_STACK_PATTERNS = [
  /\bdevops\b/i,
  /\bsite reliability\b|\bsre\b/i,
  ...
```

`run-ingestion.ts` drops anything `shouldPersistClassifiedJob` rejects, so no UI filter
could ever surface them — a filter over an empty set shows nothing. The sources already
fetched these jobs (Himalayas pulls the whole feed, Jobicy pulls `industry=engineering`)
and the classifier threw them away.

Measured after the change, against a full local ingest: **103 active Cloud & Ops jobs**
out of 3 953. That was the size of what was being discarded daily.

## Goal

Two focus areas on one radar, scored on equal footing, with a top-level track switch so
the React audience is not diluted and Cloud & Ops readers have an entry point.

## The invariant that contains the blast radius

**A cloud technology mention must never make a job relevant on its own.** Almost every
Java, Go and .NET job mentions Docker or AWS in passing. Relevance for the ops track is
decided by the **job title**, never by tech mentions in the body.

Two mechanisms enforce it, and both have tests pinning them:

1. `RELEVANT_TECHNOLOGY_NAMES` derives from `kind === 'focus'` only, not from
   `TECHNOLOGY_NAMES`. Deriving it from the full list is the flood bug: every
   competing-stack job that mentions Docker would short-circuit `isUnrelatedStack`.
2. `CLOUD_OPS_ROLE_PATTERNS` is matched against `input.title` alone, mirroring
   `isUnrelatedRole`. A backend job whose body says "infrastructure" stays off the track.

## What shipped

### Vocabulary — `lib/classification/constants.ts`

`TECHNOLOGY_PATTERNS` entries gained a `kind` of `'focus' | 'cloud'`. Nine existing
focus entries, seven new cloud ones: AWS, Kubernetes, Terraform, Docker, Azure, GCP,
Ansible. Derived: `TECHNOLOGY_NAMES`, `FOCUS_TECHNOLOGY_NAMES`, `CLOUD_TECHNOLOGY_NAMES`,
and `RELEVANT_TECHNOLOGY_NAMES` (focus only).

`/\bdevops\b/i` and `/\bsite reliability\b|\bsre\b/i` were **deleted** from
`UNRELATED_STACK_PATTERNS` and re-expressed as `CLOUD_OPS_ROLE_PATTERNS`, alongside
platform engineer, cloud engineer/architect, infrastructure engineer and systems
engineer. The data engineer, QA, android and ios disqualifiers were left alone.

`PLATFORM_ROLE_FOCUS = 'platform'` is owned here, where role focus is produced, and
imported by scoring and the repository rather than repeated as a literal.

### Classifier — `lib/classification/classify-job.ts`

- `classifyRoleFocus(input, haystack)` adds `'platform'` from the title only; the
  existing frontend/fullstack/backend/mobile detection still reads the haystack.
- `isUnrelatedStack(roleFocus, technologies, haystack)` returns `false` for a platform
  role before anything else. Without it an ops job that automates Java or Kotlin
  deploys is still dropped and the feature underdelivers.
- `'platform'` added to `JobClassification['roleFocus']` in `types.ts`.

### Equal-footing scoring — `lib/scoring/`

`scoreClassification` iterates **all** of `SCORE_WEIGHTS.technologies`. One shared table
would hand every React job that mentions Docker free points and reshuffle existing
rankings, so the track selects its own table:

```ts
const technologyWeights = classification.roleFocus.includes(PLATFORM_ROLE_FOCUS)
  ? SCORE_WEIGHTS.cloudTechnologies
  : SCORE_WEIGHTS.technologies;
```

`cloudTechnologies` mirrors the React weights (AWS 25, Kubernetes 20, Terraform 15,
Docker 15, Azure 15, GCP 15, Ansible 10) and `roleFocus.platform` is 10, beside
frontend and fullstack. React job scores are byte-identical to before this spec.

Measured on the same ingest — both tracks reach the ceiling, so equal footing is real:

| track     | count | avg score | max score |
| --------- | ----- | --------- | --------- |
| cloud-ops | 103   | 63        | 100       |
| react     | 3 850 | 25        | 100       |

### Persistence — `prisma/migrations/20260914000000_job_role_focus/`

`roleFocus` was computed on every ingest and thrown away. It is now persisted as
`jobs.role_focus`, a JSONB string array mirroring `geographies` and `countries`, and
carried through `jobCardColumns`, `createData` and the bulk upsert.

Expand-only: `DEFAULT '[]'` keeps existing rows valid, old app code ignores the column,
and new app code reads an unbackfilled row as non-platform. **No backfill script** —
ingestion re-classifies and upserts every row on every daily run, so the column
self-heals within 24 h. No contraction step.

No GIN index. `technologies` and `countries` filter without one at this table size.

### Track switch — `/jobs`

`JOB_FOCUS_FILTER_OPTIONS` (`engineering`, `cloud-ops`) is a closed set parsed by
`lib/report/parse-focus-filter.ts`, a near-copy of `parse-country-filter.ts`. Closed-set
parsing is required here: each distinct value is its own `use cache` key and therefore
its own database read.

`listActiveByScore` gains one clause — `cloud-ops` is
`{ roleFocus: { array_contains: ['platform'] } }` and `engineering` is its `NOT`, so the
two chips partition the active jobs. The filter is deliberately **not** applied to
`listCardsByCompanyIds`, which feeds hiring signals and must keep seeing every job.

The UI is a `<Link>` chip nav above the filter form, reusing the markup and active
classes from the home country chips. Two details that are load-bearing:

- Track links carry the other filters forward, so a country or seniority choice survives
  a track switch.
- A hidden `focus` input sits inside the `<form>`. A GET form only submits its own
  fields, so without it the track is silently lost on every "Apply filters".

### Copy — `lib/i18n/messages.ts`

Chip labels, nav label, and the scope statements that promised React only: `focusStack`,
`app.description`, `jobs.metaTitle`, `jobs.subtitle`, `home.subtitle`, `about.scope`,
`about.scoringJob`, and a `Platform` entry in `jobReasons`. EN and pt-BR in sync.

## Acceptance

All green as of shipping — `pnpm check` (533 tests, 57 files), `pnpm build`, `knip`,
`madge`, `boundaries`.

1. `lib/classification/classify-job.test.ts` — a DevOps title with an AWS/Kubernetes/
   Terraform body is a platform focus, not an unrelated stack; five ops titles land on
   the track; a platform role with a Java/Kotlin body persists; a React job mentioning
   Docker and AWS stays **off** the track; a Java/Spring job mentioning Kubernetes is
   still rejected.
2. `lib/scoring/score-job.test.ts` — a senior remote DevOps job scores equal to its
   React equivalent and carries the `Platform` reason; a React job's `rawScore` is
   unchanged by cloud mentions.
3. `lib/ingestion/run-ingestion.test.ts` — `role_focus` is persisted with its
   technologies.
4. `app/jobs/parse-job-filters.test.ts` — `focus` accepts the two slugs only.
5. `app/jobs/page.test.tsx` — the three chips render, the active one is marked, and the
   links preserve the other filters.
6. End to end: `pnpm db:up && pnpm ingest`, then `/jobs?focus=cloud-ops` returns ops
   roles only and `?focus=engineering` returns none of them.

## Eval commands

```bash
pnpm check
pnpm db:up && pnpm ingest
pnpm quality
```

## Out of scope

- A `platform` bucket in `lib/hiring-signals/roleBuckets`. `isEngineeringJob` already
  matches `\bengineer\b`, so ops jobs count toward company signals today; add the bucket
  when a company page needs to break them out.
- A track switch on the home page, which lists companies rather than jobs.
- SPEC-015's prominence ranking and egress work.

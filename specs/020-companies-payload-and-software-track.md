# SPEC-020 — Lighter companies page, a software-only React Engineering track, fewer obvious non-tech jobs

**Status: open.** Builds on the stack #48 → #49 → #50 → #51: the Product track,
the eligibility country filter, and the per-language vocabulary from SPEC-019.

## Problem

### The companies page ships every job

`getCompaniesPageData` loads the top `COMPANIES_PAGE_LIMIT = 100` companies,
then `listCardsByCompanyIds` returns **all** of their fresh jobs with no
per-company limit. `CompaniesReport` is a client component, so each card is
serialized twice: once as HTML and once as the RSC payload.

Measured on production, `https://remote-engineering-radar.vercel.app/`,
2026-09-21:

| Metric                          | Value                                                       |
| ------------------------------- | ----------------------------------------------------------- |
| Job cards on `/`                | **3,547** (`/jobs/<uuid>` links)                            |
| Largest company                 | mercor, 711 jobs; median 13 per company                     |
| HTML                            | **5.1 MB** (498 KB brotli over the wire)                    |
| RSC flight data inside the HTML | 1.6 MB                                                      |
| Caching                         | `Cache-Control: no-store`, `X-Vercel-Cache: BYPASS`, ~1.5 s |

Himalayas has only been ingested since 2026-09-07. Its 30-day window is half
full, so this roughly doubles on its own.

### "React Engineering" holds almost everything

The engineering chip is defined as the absence of the Cloud & Ops, Data
Annotation and Product role focus. It currently holds **19,396 of 20,176**
active jobs, and most of them are not software.

Active remote jobs from the last 30 days that have no role focus, no
React/cloud technology, and no `engineer|developer|desenvolvedor|
programador|engenheir|sre|devops|architect` title (14,499), bucketed by
title:

| Bucket                                                                                                                                                                                   | Jobs  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- |
| software missed by that regex (web, mobile, CTO, …)                                                                                                                                      | 662   |
| data / ML / AI / scientist                                                                                                                                                               | 567   |
| design / UX                                                                                                                                                                              | 404   |
| ERP / CRM platforms (SAP, Salesforce, …)                                                                                                                                                 | 364   |
| IT / support / network                                                                                                                                                                   | 287   |
| data analytics / DBA                                                                                                                                                                     | 193   |
| security                                                                                                                                                                                 | 171   |
| QA / test                                                                                                                                                                                | 56    |
| clearly non-tech (sales, finance, legal, clinical, teaching, translation, …)                                                                                                             | 3,292 |
| other: mostly non-tech ("Tax Manager", "Travel Coordinator", "Physician Partner"), with some product titles mixed in ("Principal Product Manager", "Vice President, Product Management") | 8,503 |

## Decisions (from the product owner)

1. **React Engineering means software.** Tech-adjacent jobs (data, design,
   security, ERP, IT, QA) stay stored and appear under **All roles**, not on
   the React Engineering chip.
2. **At ingest, drop only obvious non-tech jobs.** Ambiguous titles stay stored.
   The priority is near-zero false negatives.

## Part A — Cap the jobs shipped per company

- `jobs-repository.ts`:
  - `countByCompanyIds(companyIds, options)` returns `Map<companyId, number>`.
    Use `groupBy` with `_count`, under the same `where` as
    `listCardsByCompanyIds`.
  - `listCardsByCompanyIds(companyIds, { …, perCompanyLimit })`. Prisma can't
    take N per group, so:
    1. select `id, companyId, postedAt, firstSeenAt, score` under the existing
       `where`
    2. keep the first `perCompanyLimit` per company, ordered newest first then
       by score. This is the same order the method already sorts by.
    3. load card columns for the kept ids

    This keeps a single definition of the filters (`countryFilter`,
    `focusFilter`, freshness) instead of re-expressing them in raw SQL. Step 1
    reads 5 small columns and is bounded by the same filters.
- `lib/report/constants.ts`: `COMPANY_JOBS_PREVIEW_LIMIT = 5`.
- `get-companies-page-data.ts`: `openEngineeringJobs` comes from
  `countByCompanyIds`; `jobs` comes from the capped list.
- `CompanyJobs`: when `openEngineeringJobs > jobs.length`, show a "See all N
  jobs" link to `/jobs?company=<slug>`, carrying the current `country` and
  `focus`. Put the copy in the `en` and `pt-BR` catalogs.
- `/jobs` `company` filter:
  - `parseJobFilters` accepts only `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, up to 80
    characters, lowercased and trimmed.
  - `listActiveByScore` filters `company: { slug }`.
  - an unknown slug returns an empty list, not an error.
  - the canonical URL and `focusHref` preserve `company`.

**Target:** ≤ 500 cards on `/` (100 × 5) with company counts unchanged.

## Part B — React Engineering requires a software signal

- Vocabulary concept `softwareTitle`, matched against the folded title:
  - `en.ts`: `\bengineer(?:s|ing)?\b`, `\bdeveloper\b`, `\bsoftware\b`,
    `\bprogrammer\b`, `\btech(?:nical)?\s+lead\b`,
    `\bfront[-\s]?end\b|\bback[-\s]?end\b|\bfull[-\s]?stack\b`, `\bmobile\b`,
    `\bios\b`, `\bandroid\b`, `\bweb\b`, `\bcto\b`
  - `pt.ts`: `\bdesenvolvedor(?:a|\(a\))?(?=\W|$)`,
    `\bprogramador(?:a|\(a\))?(?=\W|$)`, `\bengenheir[oa]\s+de\s+software\b`,
    `\blider\s+tecnic[oa]\b`
- `SOFTWARE_ROLE_FOCUS = 'software'` goes in `lib/classification/constants.ts`.
  `classifyRoleFocus` adds it when any of these holds:
  - `softwareTitle` matches the title
  - frontend/fullstack/backend/mobile is present
  - a `RELEVANT_TECHNOLOGY_NAMES` technology is present
- `focus-filter.ts`: engineering = contains `software` AND NOT (platform |
  annotation | product). The chips no longer partition every job, and **All
  roles** is still everything.
- Update the scoring copy (`scoringJob` in both catalogs) only if it claims
  that the chips partition all jobs. It doesn't today.
- **Backfill** in `scripts/reclassify-active-jobs.ts`, a one-off dev script:
  - reads active rows (`title`, `description`, `location`, `remotePolicy`,
    `seniority`)
  - runs `classifyJob` + `scoreClassifiedJob` exactly as `enrichJob` in
    `run-ingestion.ts` does, reusing those functions
  - writes `technologies`, `seniority`, `role_focus`, `geographies` and `score`
    in batches of 1,000 via `UPDATE jobs SET … FROM unnest(...)`
  - never touches `countries`, `remote_policy` or `is_active`
  - supports `--dry-run`, which prints counts only

  This also lands the Product track, the Portuguese vocabulary, and the
  principal fix on stored rows.

## Part C — Drop obvious non-tech titles at ingest, guarded

- Vocabulary concept `nonTechTitle`, with high-precision categories only:
  - `en.ts`:
    - `\bnurs(?:e|es|ing)\b`, `\b(?:rn|lpn|cna)\b`, `\bphysician\b`,
      `\bpharmacist\b`, `\bdental\b`, `\btherapist\b`
    - `\baccountant\b|\baccounting\s+(?:clerk|specialist|manager)\b|\bbookkeep(?:er|ing)\b`,
      `\btax\s+(?:manager|preparer|associate|accountant|senior)\b`
    - `\bparalegal\b|\battorney\b|\blawyer\b|\blegal\s+counsel\b`
    - `\bteacher\b|\btutor\b`, `\btranslator\b|\binterpreter\b`
    - `\bcustomer\s+service\s+representative\b|\bcall\s+center\b`
    - `\binsurance\s+agent\b|\bunderwriter\b`, `\breal\s+estate\s+agent\b`
    - `\bdriver\b`, `\bwarehouse\b`
  - `pt.ts`: `\benfermeir[oa]\b`, `\bcontador(?:a|\(a\))?(?=\W|$)`,
    `\badvogad[oa]\b`, `\bprofessor(?:a|\(a\))?(?=\W|$)`,
    `\btradutor(?:a|\(a\))?(?=\W|$)|\binterprete\b`, `\batendente\b`
- `isUnrelatedRole` is true when `unrelatedRoleTitle` matches (unchanged), or
  when `nonTechTitle` matches **and** the job has no software, product,
  platform or annotation role focus. That guard is what keeps "Clinical
  Software Engineer", "Tax Software Developer", and "Nurse Informatics
  Developer" in the radar.
- Stored rows are not deleted. They drop out when they age out, or when the
  backfill runs. Extend the backfill so it also deactivates active rows that are
  now unrelated: set `is_active = false`, the same state ingestion leaves them in.

## Acceptance

- RED → GREEN tests:
  - classifier: software signal (en + pt titles, role focus, tech), each
    `nonTechTitle` category, the three guard titles, "Principal Product
    Manager" still product
  - repositories: per-company cap and ordering; count unaffected by the cap;
    the `company` filter; engineering requires `software`
  - page: the "See all N jobs" link keeps `country` and `focus`
- **False-negative audit, the gate for Part C.**
  - Run `--dry-run` on prod and print the titles that would be deactivated.
  - Hand-review 200 of them at random. **Zero** may be software, product, data,
    design or security; each hit narrows the pattern that caught it.
  - Report in the PR: counts per category, React Engineering size before and
    after, and how many tech-adjacent jobs remain under All roles.
- Payload after deploy: `curl --compressed /` shows ≤ 500 `/jobs/` links.
  Report the HTML size before and after.
- `vitest run`, `tsc`, eslint and knip pass.

## Out of scope

- Reducing `JOB_MAX_AGE_MS` from 30 to 14 days. Today: 19,910 vs 20,176 jobs,
  because Himalayas is only ~14 days old. At steady state: ~20k vs ~45k, and
  ~6.5k vs ~14k with a software signal. It's a one-constant decision, made
  separately.
- Caching the companies page response.

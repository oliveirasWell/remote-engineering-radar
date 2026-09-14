# SPEC-017 — Scale sources: Remote OK, and why not Tecla

## Goal

Add one high-yield remote source. Every candidate below was probed live on 2026-09-14
against the current classifier, so the numbers are measured, not estimated.

## Tecla — blocked, do not build

`https://app.tecla.io/jobs` was the original request. It is not ingestible.

| Probe                                | Result                                                 |
| ------------------------------------ | ------------------------------------------------------ |
| `GET app.tecla.io/jobs`              | 200, **4 797 bytes** — a CRA shell, no job data        |
| Same URL with a Googlebot UA         | Identical 4 797 bytes — no bot prerendering            |
| `GET api.tecla.io/api/jobs/jobs/`    | **401** `Authentication credentials were not provided` |
| `GET api.tecla.io/api/jobs/filters/` | 200 — a skills taxonomy, no jobs                       |
| `app.tecla.io/robots.txt`            | `Disallow: /` with `Allow: /jobs`, `/job`              |
| `www.tecla.io/sitemap.xml`           | No job URLs                                            |

The job list is a Django REST endpoint behind `\/api\/users\/login\/`. Ingesting it would
mean creating an account, storing credentials, and pulling a gated product's database on
a schedule. That is a different activity from the ten existing sources, all of which read
public unauthenticated feeds, and it is not something this repo should do. Recorded here
so nobody re-investigates.

If Tecla is wanted specifically, the route is to ask them for API access or a partner
feed, not to automate a login.

## Candidates probed

| Source           | Endpoint                                                    | Fetched | Would persist | Verdict        |
| ---------------- | ----------------------------------------------------------- | ------- | ------------- | -------------- |
| **Remote OK**    | `remoteok.com/api`                                          | 99      | **81**        | **Build this** |
| Remotive         | `remotive.com/api/remote-jobs`                              | 16      | 14            | Not worth it   |
| Arbeitnow        | `arbeitnow.com/api/job-board-api`                           | 250     | 17 remote     | Poor fit       |
| We Work Remotely | `weworkremotely.com/categories/remote-programming-jobs.rss` | 25      | not measured  | Fallback       |

- **Remotive** returns **16 jobs in total** today (6 Software Development). Its own legal
  notice also forbids republishing to third-party sites and demands attribution. A whole
  adapter for six jobs is not worth the lifecycle cost.
- **Arbeitnow** paginates 250 at a time but only ~8 % carry `remote: true`, and the feed
  is predominantly German-language local roles. Wrong market for a Brazil/LATAM radar.
- **We Work Remotely** is RSS, 25 items per category. Keep as a fallback if Remote OK
  alone does not move the number.

### Overlap is not a concern here

Measured: of Remote OK's 99 current jobs, **0** matched an active job in the database by
normalized company + title. This matters because `deduplicateJobs` pass 2 keys on
`company | title | normalized apply URL`, and aggregators rewrite the apply URL to their
own domain — two aggregators listing the same role would produce two cards, not one. The
measurement says that is not happening today; **re-measure before adding a second
aggregator**, because that is the source of the risk.

## Source 1 — Remote OK

**Endpoint** (GET, no auth, no key):

```
https://remoteok.com/api
```

Returns a JSON array whose **element 0 is a legal/metadata object, not a job** — skip it.
No pagination; the feed is the ~100 most recent postings. One fetch per daily ingest.

**Attribution is a binding condition**, stated in element 0:

> Please link back (with follow, and without nofollow!) to the URL on Remote OK and
> mention Remote OK as a source, so we get traffic back from your site. If you do not
> we'll have to suspend API access.

Both halves are satisfiable and both are required:

- The link-back is already how `JobCard` renders — `href={job.url}` with
  `rel="noreferrer"`, which is **not** `nofollow`, so the link follows. Keep it that way;
  do not add `nofollow` to job links.
- The mention needs a new entry in `about.sources` (EN and pt-BR), like every other
  source. Do not skip this — it is the condition of access.

**Fields → `NormalizedJob`:**

| API           | `NormalizedJob`                                                       |
| ------------- | --------------------------------------------------------------------- |
| `id`          | `sourceJobId`                                                         |
| `position`    | `title`                                                               |
| `company`     | `company.name` (trailing whitespace is common; trim)                  |
| `url`         | `url` (validate with `isSafeExternalUrl`)                             |
| `epoch`       | `postedAt = new Date(Number(epoch) * 1000)`                           |
| `location`    | `location` — free text, often a city despite remote                   |
| `description` | `description = stripHtml(description)`                                |
| `tags[]`      | ignore — see below                                                    |
| —             | `source = 'remoteok'`, `remotePolicy = 'remote'`, `technologies = []` |

`date` is an ISO string and `epoch` a **string** of unix seconds; prefer `epoch` and
guard `Number.isFinite`. Every listing on Remote OK is remote, so `remotePolicy` is fixed
and the job passes the `REMOTE_POLICY_REMOTE` gate.

**Leave `technologies: []`.** `tags` is a noisy marketing taxonomy (`'exec'`, `'sys
admin'`, `'technical'`) that does not match `TECHNOLOGY_NAMES`, and `enrichJob` runs
`classifyJob` afterwards anyway. Feeding tags in would poison both the React and the
Cloud & Ops tracks — `'sys admin'` in particular is the kind of value that must not be
allowed to imply a platform focus, since SPEC-016 deliberately decides that from the
title alone.

## Implementation

Clone `lib/sources/getonbrd/` — the four-file shape, per the recipe in
`scale-sources-himalayas-jobicy.md`:

- `lib/sources/remoteok/constants.ts` — `REMOTEOK_SOURCE_NAME`, `REMOTEOK_API_URL`
- `lib/sources/remoteok/normalize-remoteok-job.ts`
- `lib/sources/remoteok/remoteok-adapter.ts` — takes `fetch?` in options so tests drive a
  fixture; uses `fetchWithRetry` / `readJsonResponse` from `lib/sources/fetch-json.ts`
- `lib/sources/remoteok/fixtures/jobs.json` — a real trimmed capture, metadata element
  included so the skip is exercised
- `lib/sources/remoteok/remoteok-adapter.test.ts`

Then register it in `scripts/ingest.ts` beside the other ten, and add the About entry.

`complete` is `true`: the feed is a full current snapshot, so `deactivateMissingBySource`
may retire jobs it no longer lists.

## Acceptance

RED-GREEN-REFACTOR. RED fails on an assertion about normalization, not on a stub.

1. The metadata element at index 0 is skipped and never becomes a job.
2. A fixture job normalizes every field in the table above, with `postedAt` derived from
   `epoch` and `description` stripped of HTML.
3. A job with an unsafe or missing `url` is discarded.
4. A malformed `epoch` yields `postedAt: null` rather than an `Invalid Date`.
5. `technologies` is `[]` regardless of what `tags` contains.
6. End to end: `pnpm ingest` reports a non-zero `persisted` for `remoteok`, and the
   measured baseline of 81 is roughly met.

## Eval commands

```bash
pnpm check
pnpm db:up && pnpm ingest
```

## Out of scope

Remotive, Arbeitnow, We Work Remotely, and any ATS-board adapter (Workable,
SmartRecruiters, Recruitee) — those follow the `GREENHOUSE_BOARD_TOKENS` pattern and need
a curated slug list, which is its own decision.

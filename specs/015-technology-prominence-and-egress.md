# SPEC-015 — Technology prominence and egress attribution

Two independent workstreams, two PRs. Part 2 starts with measurement, not code.

---

## Part 1 — Rank a job by the stack it is actually about

### Problem

The Himalayas job [Full Stack Developer — TechBiz Global](https://himalayas.app/companies/techbiz-global/jobs/full-stack-developer-397759707)
is displayed as **"React · TypeScript"**. It is a .NET Core + Angular role: the focus
stack appears once, inside a laundry list ("using Angular, React, HTML5, CSS3,
JavaScript, and TypeScript"), while Angular appears 4x, .NET 5x, C# 3x. It scores ~80
(React 25 + TypeScript 20 + Fullstack 10 + Remote 10 + Senior 15).

Root cause — `lib/classification/classify-job.ts:126-138`:

```ts
const hasRelevantTech = technologies.some((tech) =>
  RELEVANT_TECHNOLOGY_NAMES.has(tech),
);
if (hasRelevantTech) {
  return false; // the .NET / C# guard below is never evaluated
}
return UNRELATED_STACK_PATTERNS.some((pattern) => pattern.test(haystack));
```

`UNRELATED_STACK_PATTERNS` already holds `.net` and `c#` patterns, but a single
incidental "React" short-circuits the guard. Compounding it, `extractTechnologies`
records **presence, not prominence**, so one mention earns the same chip as a real React
role.

### Goal

A job is ranked by the stack it is actually about. When a competing stack dominates the
text, the job never reaches the radar; when it survives, the card leads with its real
main technologies. The rule is general, not a .NET special case.

### One vocabulary, four kinds

> **Superseded in part by [SPEC-016](016-cloud-ops-focus.md), which shipped first.**
> The `kind` field, `FOCUS_TECHNOLOGY_NAMES`, and the cloud entries now exist in
> `lib/classification/constants.ts`. This part is therefore an **extension**, not a
> rewrite: add `neutral` and `competing` to the existing union, and leave the
> `focus`/`cloud` entries and their derived exports alone.

The vocabulary at the time of writing was 9 regexes and none of them described the
competing market. SPEC-016 grew it to 16 across two kinds. Grow `TECHNOLOGY_PATTERNS`
in `lib/classification/constants.ts` the rest of the way, as a single flat table where
each entry declares what it means for relevance (the repo already prefers immutable
lookup tables over conditional chains):

```ts
export const TECHNOLOGY_PATTERNS = [
  { name: 'React', kind: 'focus', pattern: /\breact\b(?!\s*native)/i },
  // …
  { name: 'AWS', kind: 'cloud', pattern: /\baws\b|\bamazon web services\b/i },
  // …
  { name: 'PostgreSQL', kind: 'neutral', pattern: /\bpostgres(?:ql)?\b/i },
  { name: 'Angular', kind: 'competing', pattern: /\bangular\b/i },
] as const;
```

- **focus** (counts for React-track relevance) — already shipped: React, React Native,
  TypeScript, Node.js, GraphQL, Apollo, Jest, React Testing Library, Expo. Add Next.js,
  Express and NestJS, which imply the same stack. Only the 5 in
  `SCORE_WEIGHTS.technologies` carry score, exactly as today.
- **cloud** (counts for Cloud & Ops relevance) — already shipped: AWS, Kubernetes,
  Terraform, Docker, Azure, GCP, Ansible. **These are no longer neutral.** They are the
  Cloud & Ops track's focus and they carry score through
  `SCORE_WEIGHTS.cloudTechnologies`. Do not move them.
- **neutral** (displayed, counts for neither side): JavaScript, PostgreSQL, MySQL,
  MongoDB, Redis. These appear in React and Angular jobs alike; letting them vote would
  poison the ratio.
- **competing** (implies a different primary stack): C#, .NET, Java, Spring, Python,
  Django, FastAPI, PHP, Laravel, Ruby, Ruby on Rails, Go, Rust, Kotlin, Swift, Elixir,
  Scala, Angular, Vue, Svelte, Nuxt.

Derived exports: `TECHNOLOGY_NAMES` (all, ordered) and `FOCUS_TECHNOLOGY_NAMES` already
exist — SPEC-016 added them and retired `RELEVANT_TECHNOLOGY_NAMES`'s derivation from
the full list. Point the jobs filter dropdown (`app/jobs/jobs-presentation.tsx`) at
`FOCUS_TECHNOLOGY_NAMES.concat(CLOUD_TECHNOLOGY_NAMES)`, so it keeps offering the two
stacks the radar is about instead of ~50 options.

Regex traps to get right the first time. Every pattern stays a flat alternation of
literals so the existing ReDoS budget holds:

- `.NET` — today's `/\b\.net\b/i` **cannot match a leading ".NET"**, because `\b` before
  a dot demands a preceding word character. Use `/\.net\b/i`, which also covers "ASP.NET".
- `C#` — `/\bc#/i`; a trailing `\b` after `#` would require a word character after it.
- `Go` — never bare `\bgo\b`: `/\bgolang\b|\bgo\s+(?:developer|engineer|backend)\b/i`.
- `Spring` — `/\bspring\s?boot\b|\bspring framework\b/i`, or the season matches.
- `Express` — `/\bexpress\.?js\b/i`, or "express delivery" matches.
- `Java` — keep `/\bjava\b(?!script)/i`. `Vue` — `/\bvue(?:\.js)?\b/i`.

Keep `UNRELATED_STACK_PATTERNS` for the **role**-based disqualifiers it still holds
(data engineer, QA, android/ios): a different job, not a different technology inside the
same job. Remove from it only the language and framework entries the new table now owns,
so no pattern lives in two places.

**Do not reinstate the devops and SRE disqualifiers.** SPEC-016 deleted them on purpose
— those roles are now a tracked focus area with their own scoring table, not a reason to
drop a job. They live in `CLOUD_OPS_ROLE_PATTERNS`, matched against the title only.

```ts
/** Competing mentions must outweigh focus mentions this much to reject a job. */
export const COMPETING_DOMINANCE_RATIO = 2;
```

### Classifier changes

`lib/classification/classify-job.ts`:

- Add `countMatches(pattern: RegExp, text: string): number` using
  `text.matchAll(new RegExp(pattern.source, 'gi'))`. `matchAll` clones the regex, so no
  `lastIndex` state leaks between jobs and the existing non-global patterns are untouched.
- `extractTechnologies` returns names **ordered by mention count descending**, ties
  broken by table order: prominence, not presence. That ordering is the main stack the
  card renders.
- Replace the early return in `isUnrelatedStack` with the general rule, **keeping
  SPEC-016's platform short-circuit ahead of it** (a job whose title names a Cloud & Ops
  role is never unrelated, whatever its body automates):
  - the title decides when explicit — a focus **or cloud** name in `input.title` means
    never unrelated; a competing name in the title with no focus or cloud name means
    unrelated;
  - otherwise `competingMentions >= focusMentions * COMPETING_DOMINANCE_RATIO &&
competingMentions > 0` means unrelated. A tie or a minority mention keeps the job;
  - the ratio counts focus and cloud mentions together on the surviving side, so an
    ops job heavy in Python does not read as dominated;
  - keep today's fallback: with no focus or cloud technology at all, the role-based
    `UNRELATED_STACK_PATTERNS` still applies.
- Delete the dead `if (found.has('React Native')) { }` block at lines 118-121.

`shouldPersistClassifiedJob` and the `-50 unrelatedStack` weight already consume
`isUnrelatedStack`, so dropping needs no new wiring. Ingestion re-classifies every run
(`lib/ingestion/run-ingestion.ts:65-95`) and a job that stops being persistable is
retired by `deactivateBySourceJobIds` on the partial-feed path, so existing rows
self-heal on the next daily run.

### Surfacing the survivors

`run-ingestion.ts:84` already persists `classification.technologies` into the
`technologies` JSONB column, which now carries the full ranked stack: **no schema or
pipeline change**. Verified safe:

- `SCORE_WEIGHTS.technologies` iterates its own 5 keys, so extra names cannot change a
  score or a reason.
- `lib/hiring-signals/detect-hiring-signals.ts` tests `.some(tech => RELEVANT_TECHS.has(tech))`
  against its own hardcoded 5-name set, and regexes the joined array for
  react/node/graphql/expo; extra names cannot make either true when it was false.
- The technology filter uses `array_contains`, which is order-independent.

`components/report/JobCard/JobCard.tsx` renders `job.technologies.join(' · ')` today.
Render the same ranked list as spans instead, focus names in `text-foreground` and the
rest in `text-muted-foreground`, so ".NET · Angular · C# · TypeScript · React" reads
honestly at a glance. No new copy, so no i18n change.

### Acceptance

RED-GREEN-REFACTOR, following `lib/classification/classify-job.test.ts` conventions
(colocated test, Vitest globals, inline literals, named constants hoisted).

1. RED: a case built from the real TechBiz description (the .NET Core/Angular sentences,
   hoisted as a named constant) asserting `isUnrelatedStack === true` and `technologies`
   starting with `.NET`/`Angular`, not `React`.
2. Stays green: a genuine React role mentioning .NET once is kept, React first; a
   "Senior React Engineer" title with a Java-heavy body is kept by the title override; a
   Python/Django role is rejected by the same rule that rejects the .NET one; a job heavy
   in neutral terms (PostgreSQL/Redis) never tips the ratio; the 10 SPEC-006 acceptance
   cases; **every SPEC-016 case** — a DevOps title with a Java body still persists, a
   React job mentioning Docker stays off the platform track, a Java job mentioning
   Kubernetes is still rejected; the ReDoS guard (`'LATAM '.repeat(40_000)` under
   500 ms), which now runs ~50 global scans over the same haystack.
3. `lib/scoring/score-job.test.ts` — a dominated job lands in the low band with the
   `Unrelated stack` reason.
4. Card test — a mixed job renders focus names and the rest with different emphasis, in
   ranked order.
5. End to end: `pnpm exec tsx scripts/ingest.ts` against the dev database, then the
   TechBiz job is absent from `/jobs` and a surviving mixed job leads with its real stack.

### Eval commands

```bash
pnpm vitest run
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

### Out of scope

Persisting reasons, schema changes, and anything in Part 2.

---

## Part 2 — Egress: measure, then cut

### Phase 0 — attribution (before touching code)

Nothing in this phase changes the app. SPEC-015's cache-key amplification fix is already
in the code (`parseCountryFilter` runs in `app/page.tsx` outside the cached call,
`parseJobId` bounds the detail key, readers rethrow instead of caching failures), so the
remaining bytes are somewhere else and guessing is how a PR gets wasted.

Prerequisite: the production connection string exists only in the GitHub environment
`production-ingestion` and in Vercel production (`set-github-db-secrets.sh`, project ref
`fjhpbdrcoutxjunqvddf`, pooler `aws-0-us-east-1.pooler.supabase.com`). Pull it locally;
`.gitignore` already covers `.env*`:

```bash
pnpm dlx vercel@latest env pull .env.production.local
```

Then, with `DATABASE_URL` from that file (use the **5432** direct port, not the 6543
pooler: `pg_stat_statements` reads want a session connection):

```bash
pnpm dlx supabase@latest inspect db traffic-profile --db-url "$DATABASE_URL"   # read/write ratio per table
pnpm dlx supabase@latest inspect db outliers        --db-url "$DATABASE_URL"   # statements by total exec time
pnpm dlx supabase@latest inspect db calls           --db-url "$DATABASE_URL"   # statements by call count
pnpm dlx supabase@latest inspect db table-stats     --db-url "$DATABASE_URL"
pnpm dlx supabase@latest inspect db db-stats        --db-url "$DATABASE_URL"
```

None of those rank by **rows returned**, which is what egress tracks, so add one direct
query. This is the measurement that decides the rest:

```sql
select calls, rows, rows / greatest(calls, 1) as rows_per_call,
       left(query, 120) as query
from pg_stat_statements
order by rows desc
limit 20;
```

Cross-check against the dashboard usage breakdown (Database vs Storage vs Realtime vs
Auth egress) at
`https://supabase.com/dashboard/project/fjhpbdrcoutxjunqvddf/settings/billing/usage`.
The project also exposes a Prometheus endpoint
(`https://fjhpbdrcoutxjunqvddf.supabase.co/customer/v1/privileged/metrics`, HTTP basic
auth with the service-role key), worth scraping only if the `pg_stat_statements`
attribution comes out ambiguous.

Deliverable: the top statements by rows returned, mapped back to the call sites below.

### Ranked candidates

**A. The ingestion transaction reads the whole active table, daily.**
`lib/ingestion/run-ingestion.ts:246` calls
`jobsRepository.listCardsByCompanyIds([...companyIds])`. `companyIds` accumulates every
upserted company plus every deactivated job's company, and on a full daily re-ingest that
is essentially every company, so this pulls a card row (title, url, three JSONB arrays,
and the rest) for every active job, every run. It is the largest single read in the repo.
The surrounding calls are already tight: `upsertBySourceJobId` selects `{ id: true }`,
the three `deactivate*` methods select `{ companyId: true }`, and `jobCardColumns`
excludes `description`. Fix direction: recompute hiring signals only for companies whose
jobs actually changed, instead of every company touched by an idempotent upsert.

**B. The detail page pulls `description` on every cache miss.**
`get-jobs-page-data.ts:105-121` calls `findById` (full row, multi-KB `description`) for
the sole purpose of recomputing `reasons` at request time. Since the database can be
recreated: compute reasons during ingestion, persist them in a small `reasons` JSONB
column, and stop selecting — and storing — `description`. The detail page then reads card
columns only, the table loses its largest column, and reasons freeze between runs exactly
like `score` already does. Confirmed safe: `description` is read nowhere else (search
filters `location`, not description).

**C. Sitemap cache is 300s.** `lib/seo/constants.ts` sets
`SITEMAP_CACHE_LIFE.revalidate = 300` over `listSitemapJobs`, a full-table id scan.
Crawlers hitting `sitemap.xml` re-run it every 5 minutes and then walk every
`/jobs/[id]`. Raising it to hours is a one-line change; do it regardless of what the data
says.

**D. Part 1 helps here too**: every dominated job dropped is a row that stops being
stored, upserted, read back by (A), and crawled via (C).

### Acceptance

- The `pg_stat_statements` query is re-run after the change (reset with
  `select pg_stat_statements_reset();` before a fresh ingestion run) and `rows` drops for
  the targeted statement.
- One ingestion run against the dev database before and after, comparing reported row
  counts for the same input fixture.
- `lib/ingestion/run-ingestion.test.ts` already asserts the persisted score equals
  `scoreJob(job).score`; extend it for persisted reasons if (B) is taken.
- The dashboard usage curve bends over the following days.

### Eval commands

```bash
pnpm vitest run
pnpm exec tsc --noEmit
pnpm lint
pnpm build
```

### Out of scope

Rate limiting and any new infrastructure dependency; SPEC-015's earlier analysis already
ruled that out in favour of bounded cache keys plus Vercel firewall configuration.

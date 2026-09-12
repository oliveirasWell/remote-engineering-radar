# SPEC-016 — Job salary

## Status

Proposed. Single vertical slice, one PR.

## Context

No salary is captured anywhere today. `NormalizedJob` (`lib/sources/types.ts:1`) has no
salary field, the `jobs` table (`prisma/schema.prisma:26`) has no salary column, and no
view renders one. Meanwhile several providers already ship the value in the payloads we
fetch and discard.

Coverage is partial and will stay partial. That is acceptable — a salary line that
appears on the jobs that have one is strictly better than none — but it must not be
mistaken for a filterable dimension across the whole radar.

### Verified in fixtures

| Source       | Raw fields                                                 | Shape                                                          |
| ------------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| Himalayas    | `minSalary`, `maxSalary`, `salaryPeriod`, `currency`       | `158900`, `254100`, `"annual"`, `"USD"`                        |
| Jobicy       | `salaryMin`, `salaryMax`, `salaryCurrency`, `salaryPeriod` | `85000`, `110000`, `"GBP"`, `"yearly"` — frequently `0` / `""` |
| Y Combinator | `salaryRange`                                              | `"$80K - $180K"`, `"$150K - $180K CAD"`, `""`                  |

### Out of scope for this spec

- **GetOnBrd** — its API is documented to expose `min_salary` / `max_salary`, but our
  fixture (`lib/sources/getonbrd/fixtures/jobs-page-1.json`) does not contain them and
  the live payload has not been inspected. Confirm against a real response first, then
  add it as a follow-up; it is a one-normalizer change once the rest of this spec ships.
- **Greenhouse, Lever, Ashby, vagasremotas, frontendbr, Hacker News** — no structured
  salary. Parsing it out of free-text descriptions is a different problem with a much
  worse precision/recall tradeoff. Do not attempt it here.

## Decision

- Persist salary **raw**, in four nullable columns: `salary_min`, `salary_max`,
  `salary_currency`, `salary_period`. Never a pre-formatted string.
- Format at render with `Intl.NumberFormat`, the same store-canonical /
  format-at-presentation rule the project already applies to temperature.
- **No currency conversion.** A GBP job renders in GBP. FX rates are a moving dependency
  with no owner here.
- **No index, no filter, no sort** on salary. Coverage is too sparse for either to be
  honest. Add the index when a filter is actually built, not before.

### Why not one pre-formatted text column

It is three fewer columns but pushes presentation into the ingest path, bakes a locale
into stored data, and forecloses filtering later. The diff is the same size either way.

## Data model

New shared type in `lib/sources/types.ts`:

```ts
export type SalaryPeriod = 'year' | 'month' | 'hour';

export type JobSalary = {
  min: number | null;
  max: number | null;
  /** ISO 4217, uppercase. Null when the source does not state one. */
  currency: string | null;
  period: SalaryPeriod;
};
```

`NormalizedJob` gains `salary?: JobSalary`. `Job`, `JobCard`, and `NewJob`
(`lib/jobs/types.ts`) gain the four flat nullable fields, matching the column layout.

### Trust-boundary rules

External input. A source value is accepted only when it is a **finite integer greater
than zero**. Everything else — `0`, `""`, `null`, negative, non-numeric, `NaN` — is
absent, not a value. Concretely:

- Both `min` and `max` absent → `salary` is `undefined`. Do not persist a row of nulls
  with a period.
- One side absent → keep the other, keep `period`. Renders as "from X" / "up to X".
- `min > max` → drop the whole salary. A swap would be inventing data.
- `currency` must match `/^[A-Z]{3}$/` after trimming and uppercasing, otherwise `null`.
  This guard exists because `Intl.NumberFormat` **throws** on an invalid currency code.

### Period normalization

Sources disagree on vocabulary. Use an immutable lookup, not a conditional chain:

```ts
const SALARY_PERIODS: Readonly<Record<string, SalaryPeriod>> = {
  annual: 'year',
  yearly: 'year',
  year: 'year',
  monthly: 'month',
  month: 'month',
  hourly: 'hour',
  hour: 'hour',
};
```

Unknown period string → default to `'year'`. Annual is what every source in scope
actually means when it omits or mislabels the field, and the magnitude of the number
makes a wrong guess self-evident rather than silently wrong.

## Y Combinator salary parser

The only genuinely new logic. New module `lib/sources/ycombinator/parse-salary-range.ts`
with a colocated `parse-salary-range.test.ts` — the other normalizers have no direct
tests because they are pure field mapping; this one is a parser and earns its own.

```ts
export const parseSalaryRange = (raw: string): JobSalary | null
```

Accepted: `"$80K - $180K"`, `"$150K - $180K CAD"`, `"$100,000 - $150,000"`, en-dash as
well as hyphen separator. `K` suffix multiplies by 1000. Absent trailing code → `"USD"`.

Anything else returns `null` — including `""`, equity-only strings, single values with
no range, and anything with a stray token. **Do not guess.** A missing salary line costs
nothing; a wrong one is a bug someone reports.

Feed the parser's output straight into `normalizeYCombinatorJob`.

## Persistence

Migration `prisma/migrations/20260912000000_add_job_salary/migration.sql`:

```sql
ALTER TABLE "jobs"
  ADD COLUMN "salary_min" integer,
  ADD COLUMN "salary_max" integer,
  ADD COLUMN "salary_currency" text,
  ADD COLUMN "salary_period" text;
```

Purely additive and nullable, so it deploys safely ahead of the application code. No
backfill: existing rows populate on their next ingest pass.

`upsertManyBySourceJobId` (`lib/db/repositories/jobs-repository.ts`) is hand-written SQL.
Each new column must be added in **five** places or the statement silently misaligns:
the `INSERT` column list, the `SELECT` list, the `unnest(...)` argument list (as
`::int[]` / `::text[]`), the `AS t(...)` alias tuple, and the `ON CONFLICT DO UPDATE SET`
block. Also extend `createData` and `jobCardColumns` in the same file.

## Presentation

`ReportJobCard` (`lib/report/types.ts:3`) gains the four fields. Both mappers must be
updated — they are separate hand-written object literals:
`lib/report/get-jobs-page-data.ts:36` and `lib/report/get-companies-page-data.ts:99`.

New `formatSalary` in `lib/report/format.ts`, alongside the existing formatters:

- Currency present → `Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 0 })`.
- Currency `null` → `Intl.NumberFormat(locale, { maximumFractionDigits: 0 })`, no symbol.
- Both bounds → `"$80,000 – $180,000"` (en dash). One bound → the i18n `from` / `upTo`
  form. Period appended from the catalog.

`components/report/JobCard/JobCard.tsx` renders one line under the existing meta line,
and only when a salary exists. The job detail page reuses `JobCard`, so this single
change covers both views.

New keys in **both** catalogs in `lib/i18n/messages.ts` (`en` and `pt-BR`), under
`jobCard`: `salaryLabel`, `salaryFrom`, `salaryUpTo`, and period suffixes for year /
month / hour. No visible copy hardcoded in the component.

## Acceptance criteria

Follow the RED-GREEN-REFACTOR protocol in `specs/README.md` — each item below is a
failing assertion first.

1. Himalayas adapter test: a fixture job with `minSalary` / `maxSalary` / `salaryPeriod`
   / `currency` yields `{ min: 158900, max: 254100, currency: 'USD', period: 'year' }`.
2. Jobicy adapter test: a fixture job with `salaryMin: 0`, `salaryMax: 0`,
   `salaryCurrency: ""` yields **no** salary; the populated one yields GBP / `'year'`.
3. `parse-salary-range.test.ts`: `"$80K - $180K"` → 80000 / 180000 / USD;
   `"$150K - $180K CAD"` → CAD; `""` and a malformed string → `null`.
4. Validation: `min > max` drops the salary; a currency failing `/^[A-Z]{3}$/` becomes
   `null` rather than reaching `Intl.NumberFormat`.
5. Repository test: `upsertManyBySourceJobId` round-trips all four columns, and a second
   upsert of the same `(source, source_job_id)` updates them.
6. `formatSalary` test: both-bounds range, min-only, max-only, and null-currency each
   render their expected string in `en` and `pt-BR`.
7. `JobCard.test.tsx`: the salary line renders for a job with salary and is **absent**
   for a job without — asserted through the i18n label, not a hardcoded string.
8. Full suite green; no new lint or type errors.

## Deliberate omissions

- No salary filter, sort, or index — revisit once coverage is measured in production.
- No FX normalization.
- No free-text salary extraction from descriptions.
- No backfill of historical rows.

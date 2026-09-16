# Spec 015 — design system alignment, About + i18n, and cache hardening

> Run with a clean context. Everything needed is inlined here, including every
> measured value — do not re-derive the palettes from `../gym-coach` or
> `../binterview`, and do not depend on those repos being present.

Three independent parts, each its own PR in the existing stack. Execute in order;
they touch different branches.

Current stack (each branch contains its base):

```
main → #23 feat/observability
     → #24 feat/companies-home-quality
     → #25 feat/job-sources-country-filter
     → #26 feat/home-disclosure-and-theme
     → #16 refactor/prisma-data-layer
```

After each part: `pnpm check` must pass, then merge the branch forward into every
descendant so the stack stays consistent.

---

## Part A — design tokens (extend PR #26 `feat/home-disclosure-and-theme`)

### Problem

`app/theme.css` invents a blue accent (`oklch(0.55 0.16 250)`) that exists in
neither reference repo, and uses `text-accent` for the three `role="alert"` error
messages while never using `--destructive`. The house scale is fully monochrome
except `--destructive`, and is square (`--radius: 0rem`).

### Token values (verified identical in both reference repos)

Rewrite `app/theme.css` keeping its current structure — light values on bare
`:root`, dark repeated under both `@media (prefers-color-scheme: dark)
:root:not([data-theme='light'])` and `:root[data-theme='dark']`.

| token                    | light                 | dark                  |
| ------------------------ | --------------------- | --------------------- |
| `--background`           | `oklch(0.98 0 0)`     | `oklch(0.165 0 0)`    |
| `--foreground`           | `oklch(0.23 0 0)`     | `oklch(0.91 0 0)`     |
| `--card`                 | `oklch(1 0 0)`        | `oklch(0.195 0 0)`    |
| `--card-foreground`      | `oklch(0.23 0 0)`     | `oklch(0.91 0 0)`     |
| `--primary`              | `oklch(0.25 0 0)`     | `oklch(0.85 0 0)`     |
| `--primary-foreground`   | `oklch(0.99 0 0)`     | `oklch(0.14 0 0)`     |
| `--secondary`            | `oklch(0.965 0 0)`    | `oklch(0.24 0 0)`     |
| `--secondary-foreground` | `oklch(0.25 0 0)`     | `oklch(0.91 0 0)`     |
| `--muted`                | `oklch(0.965 0 0)`    | `oklch(0.24 0 0)`     |
| `--muted-foreground`     | `oklch(0.535 0 0)`    | `oklch(0.62 0 0)`     |
| `--accent`               | `oklch(0.965 0 0)`    | `oklch(0.24 0 0)`     |
| `--accent-foreground`    | `oklch(0.25 0 0)`     | `oklch(0.91 0 0)`     |
| `--destructive`          | `oklch(0.55 0.24 27)` | `oklch(0.55 0.24 27)` |
| `--border`               | `oklch(0.91 0 0)`     | `oklch(0.28 0 0)`     |
| `--input`                | `oklch(0.91 0 0)`     | `oklch(0.28 0 0)`     |
| `--ring`                 | `oklch(0.55 0 0)`     | `oklch(0.52 0 0)`     |

Note `--muted` is a **surface**, `--muted-foreground` is the **text** colour.
Radar currently has this inverted.

Expose them through `@theme inline` as `--color-<name>: var(--<name>)`, matching
the existing file. Keep `--font-sans` as it is.

**Do NOT** adopt binterview's `@custom-variant dark (&:is(.dark *))`. Radar has no
theme-toggle JavaScript; `prefers-color-scheme` is what makes dark mode work
without a client bundle.

### Square corners

Add `--radius: 0rem;` inside the `@theme` block. Radar uses the bare `rounded`
utility in exactly 4 places, and in Tailwind v4 (`4.3.3` here) `--radius` is the
variable backing the bare `rounded` utility — confirmed at
`node_modules/tailwindcss/theme.css:508`, inside its `@theme default inline
reference` "Deprecated" block. The sized `--radius-xs…4xl` namespace at lines
397–404 backs `rounded-md` etc., which radar does not use.

### Class remap

| current                                 | occurrences | becomes                                              |
| --------------------------------------- | ----------- | ---------------------------------------------------- |
| `text-muted`                            | 21          | `text-muted-foreground`                              |
| `text-accent` on links                  | 11          | `text-muted-foreground underline underline-offset-2` |
| `text-accent` on `role="alert"`         | 3           | `text-destructive`                                   |
| `text-accent` on the company kind label | 1           | `text-muted-foreground`                              |
| `bg-accent`                             | 2           | `bg-primary`                                         |
| `text-accent-foreground`                | 2           | `text-primary-foreground`                            |
| `bg-surface`                            | 2           | `bg-card`                                            |

The three `role="alert"` sites are `app/page.tsx:65`, `app/jobs/page.tsx:35`,
`app/jobs/[id]/page.tsx:19`.

Rename the `--surface` token to `--card` — there are only 2 usages.

### Link style

Follow gym-coach's `.link`: `--muted-foreground` with a **permanent** underline,
so a link is identifiable without hover. Do not use a hover-only underline, and do
not colour links with `--primary` (at `oklch(0.25 0 0)` it is within 0.02
lightness of `--foreground`, so links would be invisible as links).

### Patterns

- **Country filter nav** (`app/page.tsx`) adopts the gym-coach tabs pattern:
  unselected `text-muted-foreground`; selected `text-foreground font-semibold`
  plus `box-shadow: inset 0 -2px 0 var(--primary)`; `min-height: 44px` per item.
- **Transparency states**, as both repos use them: `opacity-50` for disabled,
  `hover:bg-muted/40` on the `<summary>` rows, and `opacity-70 hover:opacity-100`
  on the disclosure chevron.

---

## Part B — About screen + i18n (new branch `feat/about-and-i18n`, based on #26)

Open the PR with `--base feat/home-disclosure-and-theme`, then retarget #16's base
to this new branch so the stack stays linear.

### i18n

Create `lib/i18n/messages.ts` holding two catalogs plus `LOCALE_COOKIE`,
`LOCALES`, `isLocale()` and `messagesFor()`. **No new dependency.** Default locale
is **`en`**; the other is `pt-BR`.

Radar already centralises its copy, so this is a move, not a rewrite — roughly 55
keys live in `app/constants.ts` (3), `app/home-constants.ts` (8),
`app/jobs/constants.ts` (29), `components/report/constants.ts` (12) and
`lib/report/constants.ts` (3). These become the `en` catalog; write the `pt-BR`
translations alongside.

Provider and picker are **client** components (`'use client'`), mirroring
`I18nProvider` / `LanguagePicker` in gym-coach: the picker writes
`document.cookie` with `path=/; max-age=31536000; SameSite=Lax` and sets
`document.documentElement.lang`.

**This must stay client-side.** Every report reader is `'use cache'`
(`lib/report/get-companies-page-data.ts:53`, `lib/report/get-jobs-page-data.ts:49`
and `:86`). Reading a cookie in a Server Component makes the request dynamic and
would silently disable that caching. All translatable text is static UI copy —
company names and job titles come from the database and are never translated — so
a client provider costs nothing.

Keep existing tests passing: they import copy constants directly
(`app/page.test.tsx` asserts `HOME_SECTIONS.companiesToWatch`), so the `en` catalog
must remain importable under names the tests already use, or update those tests in
the same commit.

### About screen

New static route `app/about/page.tsx` — no database access, so no cache or
security concern. Reachable from a header button on every page. It explains:

- which sources are ingested (Greenhouse, Ashby, Hacker News, frontendbr,
  Himalayas, Jobicy, GetOnBrd, Lever);
- that ingestion runs once daily from GitHub Actions, so listings can be up to
  24h stale;
- that only remote roles posted within the last 30 days are shown
  (`JOB_MAX_AGE_MS` in `lib/jobs/constants.ts`);
- that the hiring score is a heuristic, not an endorsement, and that the radar
  links out to the original posting rather than accepting applications.

Include the GitHub repository link (`https://github.com/oliveirasWell/remote-engineering-radar`)
on this page and in a site footer. External links use
`target="_blank" rel="noreferrer"` and go through the existing
`isSafeExternalUrl` helper in `lib/urls/external-url.ts`.

---

## Part C — cache and abuse hardening (extend PR #25 `feat/job-sources-country-filter`)

### The actual amplification hole

`getCompaniesPageData` declares `'use cache'` at
`lib/report/get-companies-page-data.ts:53` but calls `parseCountryFilter` at line
56 — **inside** the cache. `app/page.tsx:30` passes `params.country` straight
through from the query string, so `/?country=aaa1`, `?country=aaa2`, … each mint a
distinct cache entry and a distinct `listByHiringScore` +
`listCardsByCompanyIds` round-trip. Walking that parameter walks the egress budget.

`getJobDetailData` (`lib/report/get-jobs-page-data.ts:86`) has the same shape: its
UUID regex runs inside the cached function, so every distinct `/jobs/<value>` is a
new cache entry even when it is rejected.

**Fix:** validate before the cached call, so the cache key can only take values
from a closed set. `app/jobs/parse-job-filters.ts` already does exactly this and is
the reference implementation — its comment states the rule: _"Each distinct filter
value is its own `use cache` key and therefore its own database read."_
`getJobsPageData` is already correct; only the two sites above need changing.

Regression proof: assert that an unknown filter value produces the same result as
no filter, and that the parse happens at the call site — follow the existing tests
in `app/jobs/parse-job-filters.test.ts`.

### Cached failure

The `catch` in each report reader returns `{ errorMessage }` instead of
rethrowing, and the function is cached with
`REPORT_CACHE_LIFE = { stale: 300, revalidate: 3600, expire: 86400 }`
(`lib/report/constants.ts`). One transient database blip therefore pins the error
page for up to an hour. Rethrow inside the cached function and catch in the caller
so failures are not cached.

### Rate limiting — read before acting

Radar has **no API routes and no middleware**; there are four server-rendered
pages (`app/page.tsx`, `app/jobs/page.tsx`, `app/jobs/[id]/page.tsx`,
`app/companies/page.tsx`, the last a bare redirect). Security headers already
exist in `next.config.ts` (`X-Content-Type-Options`, `X-Frame-Options`,
`Referrer-Policy`, `Permissions-Policy`, `Strict-Transport-Security`).

Per-IP rate limiting would require middleware plus a shared store (Upstash/Vercel
KV) — a new service and dependency for a site whose only expensive path is the one
fixed above. **Do not add that dependency as part of this spec.** Bounded cache
keys are the proportionate code fix; abuse control belongs in Vercel's firewall,
which is dashboard configuration, not code.

**ASK** before implementing anything beyond the two parse-before-cache fixes and
the rethrow: whether a Content-Security-Policy header should be added
(`next.config.ts` currently has none, and Sentry plus GA4 would both need to be
allowlisted), and whether per-IP limiting is actually wanted despite the cost.

---

## Verification

Per part, on its branch:

```bash
pnpm check            # format:check + lint + typecheck + test
pnpm db:up && pnpm dev
```

- **Tokens** — in the browser, confirm no rendered colour has non-zero chroma
  except error text, in both themes. Toggle with
  `document.documentElement.setAttribute('data-theme','light')` / `'dark'`.
  Expected computed body background: `oklch(0.98 0 0)` light, `oklch(0.165 0 0)` dark.
- **Square** — computed `border-radius` is `0px` on both buttons
  (`app/jobs/page.tsx`, `app/global-error.tsx`).
- **i18n** — with no cookie the UI is English; switching to `pt-BR` persists across
  reload and updates `<html lang>`.
- **Cache keys** — request `/?country=aaa1..aaa5` and five random
  `/jobs/<uuid>`, and confirm no extra database queries are issued. The local
  database is `postgres://postgres:postgres@localhost:5432/radar`; inspect with
  `docker compose exec -T db psql -U postgres -d radar`.
- **About** — renders with the database container stopped, proving it touches no data.

## Notes for the executing agent

- Repo rules that bite: exact dependency versions (no `^`/`~`), const arrow
  functions, named exports, one primary export per file, `types.ts` for type-only
  modules, `constants.ts` for grouped static values, and
  `// @vitest-environment jsdom` on any component test.
- Component tests that need browser APIs must carry that docblock; route
  handlers, schemas and adapters stay in the Node environment.
- This spec is written in English per `CLAUDE.md` and `specs/README.md`, both of
  which require English for all documentation.

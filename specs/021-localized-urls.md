# SPEC-021 — Localized URLs: Portuguese pages search engines can see

**Status: open.** Builds on #54: indexable country and focus views, and
`searchMetadata`.

## Problem

The locale is a **cookie on the same URL**. Search engines only ever see
English, so the Brazilian audience the radar targets cannot find it through
Portuguese searches ("vagas remotas React").

Verified in the code (Next 16.3.5, `cacheComponents: true`):

- `app/layout.tsx` renders `<html lang="en">` and `openGraph.locale: 'en_US'`
  on the server.
- `I18nProvider` reads the `remote-engineering-radar-locale` cookie **on the
  client only** (`useSyncExternalStore`, with `'en'` as the server snapshot),
  then swaps copy after mount. `layout.test.tsx` pins this: "renders English
  on the server even with a browser cookie, then restores Portuguese on
  mount".
- All metadata is English. `searchMetadata`, `app/about/page.tsx`
  (`messagesFor()`), the layout title template, and the site description
  default to `en`.
- `LanguagePicker` sets the cookie and does not change the URL.
- `getCompaniesPageData` hardcodes English summaries: `'Strong hiring signal'`
  and `'Company is actively expanding engineering hiring.'`. That breaks the
  catalog rule regardless of this spec.

## Goal

Every public page exists at a Portuguese URL that renders Portuguese on the
server, and it declares its language alternates. English URLs do not change.

| English (unchanged) | Portuguese (new)        |
| ------------------- | ----------------------- |
| `/`                 | `/pt-BR`                |
| `/jobs`             | `/pt-BR/jobs`           |
| `/jobs/<id>`        | `/pt-BR/jobs/<id>`      |
| `/about`            | `/pt-BR/about`          |
| `/?country=brazil`  | `/pt-BR?country=brazil` |

Query strings, including the indexable single-filter views from #54, are
preserved as they are.

## Design

### Routing

- Move `layout.tsx`, `page.tsx`, `about/`, `jobs/`, `companies/`, `error.tsx`,
  and the page-specific helpers under `app/[lang]/`.
  - `app/[lang]/layout.tsx` becomes the root layout.
  - Its `generateStaticParams` returns `LOCALES.map((lang) => ({ lang }))`.
    `cacheComponents` requires it.
- `sitemap.ts`, `robots.ts` and `icon.png` stay at the `app/` root.
  `opengraph-image.*` moves into `[lang]`, so every page still inherits it.
  `global-error.tsx` stays at the root with its own `<html>`.
- **`proxy.ts`** at the repository root. Read
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  before writing it. It handles four cases:
  1. `/pt-BR` and `/pt-BR/...` pass through.
  2. `/en` and `/en/...` get a 308 redirect to the unprefixed path, so English
     has one URL.
  3. An unprefixed path with cookie `remote-engineering-radar-locale=pt-BR`
     gets a 307 redirect to `/pt-BR/...`. This keeps a returning Portuguese
     reader in Portuguese.
  4. Any other unprefixed path is **rewritten** (not redirected) to `/en/...`.
  - Match everything except `_next`, `api`, the metadata files (`sitemap.xml`,
    `robots.txt`, `icon.png`, `opengraph-image*`), and static assets.
  - **No `Accept-Language` redirect.** Crawlers send none, and redirecting by
    browser language is what search engines advise against. A first-time
    Portuguese visitor lands in English and switches once; the cookie
    remembers the choice.
- `lang` values outside `LOCALES` return `notFound()` (`hasLocale` guard in the
  layout).

### Locale on the server

- `lib/i18n/locale.ts` defines `currentLocale()`. It reads `lang` from
  `next/root-params` in Server Components, `generateMetadata`, and `'use cache'`
  functions. Root params become part of the cache key automatically, per the
  root-params doc.
- `lib/i18n/localized-path.ts` defines `localizedPath(locale, path)`:
  - `'en'` → `path` unchanged
  - `'pt-BR'` → `/pt-BR${path === '/' ? '' : path}`
  - query strings pass through unchanged

  This is the only place that knows the URL scheme.

- `I18nProvider` receives `locale` as a prop from the layout, and stops
  reading the cookie. Delete `readLocale` and the `useSyncExternalStore`
  subscription. `setLocale` stays only as the cookie writer used by the picker.
- `<html lang={locale}>` is set on the server.
  `openGraph.locale: locale === 'pt-BR' ? 'pt_BR' : 'en_US'`.

### Links

- Every internal `href` goes through `localizedPath`. Inventory:
  - `SiteHeader`: 3 nav links and the logo
  - `JobCard`: `/jobs/<id>`
  - `jobs-presentation`: `focusHref` and the home link
  - `home-presentation`: `homeHref` and `companyJobsHref`
  - `job-detail-presentation`: back to `/jobs`
  - `companies/page.tsx`: `redirect('/')`

  Client components read the locale from `useI18n()`.

- `LanguagePicker` renders **links** to the same path and query in the other
  locale, instead of buttons. It is built with `usePathname` +
  `useSearchParams` and `localizedPath`, after stripping the `/pt-BR` prefix.
  Clicking a link also writes the cookie. Keep `lang`, `aria-current`, and the
  44 px targets.

### Metadata

- `searchMetadata`, `app/[lang]/about/page.tsx`, the job detail metadata, and
  the layout (`title.template`, `description`) use `messagesFor(await
currentLocale())`.
- `canonicalMetadata` gains `locale`. The canonical URL is the page's own
  localized URL. It adds `alternates.languages`:
  `{ en: <en url>, 'pt-BR': <pt url>, 'x-default': <en url> }`, with the same
  query on both. Keep the robots decision unchanged: an indexable view is
  indexable in both languages.
- `sitemap.ts` emits each URL once, with `alternates.languages` for `en` and
  `pt-BR` (see
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`,
  the "alternates" example). The Portuguese URLs are listed as their own
  entries too.

### Catalog fix, same PR

- The `getCompaniesPageData` summaries become a `summaryKind: 'strong' |
'expanding'` field. `CompanySummary` renders them from `messages.report`, with
  `en` and `pt-BR` entries.

## Out of scope

- Translating job titles and descriptions. They stay as posted.
- Spanish. `LOCALES` makes adding it a catalog plus one entry.
- Localized path segments (`/pt-BR/vagas`). They add a lookup table for
  little search value.

## Acceptance

- RED → GREEN:
  - `localizedPath`, both locales, root and nested paths, and query
    preservation
  - proxy decisions: pass-through, `/en` 308, cookie 307, rewrite, excluded
    paths, with `NextRequest` built in the Node environment
  - `layout.test.tsx` is rewritten. The server renders Portuguese for
    `lang='pt-BR'` (`<html lang="pt-BR">` and Portuguese nav), and there is no
    cookie read on mount. The hydration-mismatch test becomes obsolete, so
    delete it with a note.
  - `LanguagePicker` links point to the same path and query in the other
    locale.
  - metadata: `/pt-BR/jobs?country=brazil` gets the Portuguese title,
    canonical and `alternates.languages`, and is indexed like its English twin.
  - sitemap: each entry carries both alternates.
  - the companies summary comes from catalogs in both locales.
- Existing page tests pass once they render under a `lang` param instead of
  setting the cookie.
- `next build` succeeds and prerenders both `lang` values.
- On the preview deploy, `curl` checks:
  - `/` → `lang="en"`, English `<title>`, `hreflang="pt-BR"` link
  - `/pt-BR/jobs?country=brazil` → `lang="pt-BR"`, Portuguese `<title>`,
    canonical to itself
  - `/en/jobs` → 308 `/jobs`
  - `/jobs` with the `pt-BR` cookie → 307 `/pt-BR/jobs`
  - `/sitemap.xml` contains `xhtml:link` alternates
- `vitest run`, `tsc`, eslint and knip pass.

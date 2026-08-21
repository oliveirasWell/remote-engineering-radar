# Weather Forecast App — spec suite

Assessment build, executed **one spec at a time** in a red-green cycle. Read this file
completely before opening any numbered spec. All code, comments, test names, commit
messages and documentation are in **English**.

Execution order: `00-scaffold` → `01` → `02` → `03` → `04` → `05` → `06`.

---

## 1. Working protocol

For **each** spec, in this exact order:

1. **RED** — write the test(s). Run them. Confirm they fail **for the right reason**: an
   assertion failure, not an import, resolution or syntax error. Paste the failing output.
2. **GREEN** — write the minimum code to pass. Do not anticipate later specs. Run. Paste
   the passing output.
3. **REFACTOR** — clean up if needed. Run again. Tests stay green.
4. **STOP.** Write a 3-line summary: what was built, what design decision was made, what
   is still open. **Wait for approval before the next spec.**

Cycle rules:

- Never write implementation before a test fails.
- Never adjust a test to accommodate broken code. If the test itself was wrong, say so
  explicitly and explain why before changing it.
- Never mark a spec done with a skipped, commented-out or `.skip` test.
- If a spec seems underspecified, **ask before implementing**. Do not invent requirements.
  Points needing a decision are marked **ASK** inline.
- One commit per spec: `feat(spec-N): description`.

A spec is a vertical slice. Within a slice work **inside-out**: domain logic and its unit
tests first, then the route handler, then the components. Each layer gets its own
red-green cycle before you move outward.

### The "right reason" rule, concretely

The most common way this protocol fails is a RED that is actually a module error. Two
known traps in this repo, both already solved in `00-scaffold`:

- `import 'server-only'` **throws on import** under Vitest.
- `@/…` path aliases need `vite-tsconfig-paths`.

If a first run errors with `This module cannot be imported from a Client Component
module`, `Cannot find module`, or `Failed to resolve import`, that is **not** a valid RED.
Fix the config, then get a real assertion failure.

---

## 2. Stack

Already present in the repo (do not change versions):

- **Next.js 16.3.1**, App Router, TypeScript strict
- **React 19.2.8**, React Compiler enabled (`reactCompiler: true` in `next.config.ts`)
- **pnpm 11.22.0**, declared in `packageManager`

To be added in `00-scaffold`:

- CSS Modules + custom properties in a theme file
- TanStack Query v5 for client-side fetching
- `useState` / props for UI state — no state library
- Zod for API response validation
- Vitest + React Testing Library for unit and component tests
- Cypress for E2E
- Inter via `next/font`
- weather-icons (Erik Flowers) — **see §6, the brief's `wi-owm-*` instruction cannot be
  followed as written**

> This version of Next.js has breaking changes relative to older training data. The
> repo ships its own docs at `node_modules/next/dist/docs/`. Consult them rather than
> recalling older Next behaviour. Citations below point into that tree.

---

## 3. Architecture contract

```
app/
  layout.tsx
  page.tsx
  theme.css
  providers.tsx              QueryClientProvider
  api/
    geocode/route.ts
    weather/route.ts
components/
  ui/                        Input, Button, Card, Spinner
  weather/                   SearchPanel, CityResults, CurrentWeather,
                             ForecastGrid, ForecastCard, Disclaimer
lib/
  weather/
    types.ts                 port: WeatherProvider + domain types
    schemas.ts               Zod schemas for raw OpenWeather responses
    openweather.ts           adapter (only file that knows OpenWeather)
    aggregate.ts             pure aggregation function
    fixtures/                real API responses for tests
```

The `create-next-app` boilerplate (`app/page.module.css`, `app/globals.css`, the default
`app/page.tsx` body, `public/*.svg`) is deleted along the way. `AGENTS.md` is regenerated
by `next dev` — leave it in place and commit it if it shows up dirty.

### Boundary rules — verifiable by grep

- `components/**` imports only `lib/weather/types`, never `openweather`, `schemas` or
  `aggregate`.
- `components/**` never sees raw API fields (`main.temp_min`, `weather[0].icon`,
  `dt_txt`). Only domain types.
- `lib/weather/**` never imports React, Next, or anything from `components/`.
- `lib/weather/openweather.ts` has `import 'server-only'` at the top.
- `components/ui/**` never imports from `components/weather/**`. Components in `ui/` take
  primitive props and know nothing about the weather domain; components in `weather/`
  compose them.

`import/no-restricted-paths` enforces this in ESLint. **The rule is part of the
deliverable**, configured in `00-scaffold`.

### Domain types

Hand-written — this is the contract. Do **not** generate these from the API shape; the
whole point of the adapter is that they do not mirror OpenWeather.

```ts
export type CityMatch = {
  id: string;        // `${lat},${lon}`
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
};

export type CurrentWeather = {
  city: string;
  temp: number;          // already rounded
  condition: string;
  iconCode: number;      // OWM weather[0].id
  isDay: boolean;
};

export type ForecastDay = {
  date: string;          // YYYY-MM-DD in the city's timezone
  label: string;         // "Today" | "Tuesday" | ...
  low: number;
  high: number;
  iconCode: number;
  isPartial: boolean;    // first day may have few blocks
};

export interface WeatherProvider {
  searchCities(query: string): Promise<CityMatch[]>;
  getCurrent(lat: number, lon: number): Promise<CurrentWeather>;
  getForecast(lat: number, lon: number): Promise<ForecastDay[]>;
}
```

**Raw types** — derive from the Zod schemas in `schemas.ts` with `z.infer`. Build the
schemas from the saved fixtures. These types live in the adapter layer only.

---

## 4. OpenWeather API rules

- Endpoints: `/geo/1.0/direct`, `/data/2.5/weather`, `/data/2.5/forecast`.
- Geocoding is a separate step **on purpose**: the UI shows a list of matching cities so
  the user disambiguates. `q=` on the 2.5 endpoints returns a single arbitrary match and
  is not an option here.
- `units=imperial` — the reference design is in Fahrenheit.
- Key in `OPENWEATHER_API_KEY`. **No `NEXT_PUBLIC_` prefix.** If `NEXT_PUBLIC_` appears
  anywhere near the key, the deliverable is wrong.
- Cache via `fetch(url, { next: { revalidate: N } })`:
  - geocode → `2592000` (30 days — city coordinates do not change)
  - current → `600`
  - forecast → `600`
- `/data/2.5/forecast` returns **40 three-hour blocks**, not days. Aggregation is your job.
- `city.timezone` (offset in seconds) must be applied **before** grouping by day. Grouping
  by server timezone is a bug.

### The key

`OPENWEATHER_API_KEY` is exported from the operator's `~/.zshrc` (32 chars). `00-scaffold`
writes it into `.env.local`, which is gitignored. The same variable will be set on Vercel.
Never print the value into a transcript, a test fixture, a log line or a commit.

---

## 5. Verified environment facts

Everything below was checked directly this session — against the live API, the bundled
Next docs, and unpacked npm tarballs. **Trust these over recollection.** Each one exists
because following the brief naively at that point produces a broken or misleading result.

| # | Fact | Consequence |
|---|---|---|
| F1 | The npm package `weather-icons` has exactly one published version, **1.3.2** (2015). Its CSS defines 177 `.wi-*` classes and **zero** `wi-owm-*` classes. | The brief's `wi-owm-*` instruction cannot be followed. See §6. |
| F2 | `server-only@0.0.1` `exports` maps `react-server`→`empty.js` and `default`→`index.js`, and `index.js` is a bare `throw`. | Importing `lib/weather/openweather.ts` under Vitest throws at import time. Aliased in `00-scaffold`. |
| F3 | `eslint-plugin-import` and `eslint-import-resolver-typescript` are present only as **transitive** deps of `eslint-config-next`. pnpm's strict layout does not expose them at top level. | Must be added as explicit devDeps or the boundary rule cannot be configured. |
| F4 | Next 16 made caching opt-in, **but** `cacheComponents` is off in `next.config.ts`, so the previous model applies and a positive `next.revalidate` *does* opt a fetch into the Data Cache. Source: `node_modules/next/dist/docs/01-app/02-guides/caching-without-cache-components.md` lines 149-180. | §4's `next: { revalidate: N }` is correct as written. Do not "fix" it. |
| F5 | Route Handlers are **not** cached by default, and `fetch` memoization does not apply inside them. Source: `.../01-getting-started/15-route-handlers.md`, `.../03-api-reference/04-functions/fetch.md`. | Only the upstream OpenWeather fetch is cached, not our route's response. That is the intent. |
| F6 | Vitest 4 removed `environmentMatchGlobs`. | Use the per-file `@vitest-environment` docblock (see `00-scaffold`). |
| F7 | Live API confirmed: `geo/1.0/direct?q=chicago` → 200, 5 results; `q=springfield` → 5 US states; `q=asdfgh` → `[]`; bad key → **401**; `data/2.5/forecast` → `cnt: 40`; Chicago `timezone: -18000` (**UTC-5**). | These are exactly the fixtures Specs 1 and 3 need, and 401 is the real upstream-failure path. |
| F8 | The geocode response includes a `local_names` object, and `state` is **absent** for non-US cities. | A strict Zod schema rejects real payloads. |
| F9 | The repo is **not** a git repository and has no `.gitignore`. | "One commit per spec" fails at Spec 1 unless `00-scaffold` runs `git init`. |
| F10 | The reference design is `2026-08-21_01-42.png` in the repo root, 1319x871. Sidebar measures 327px there, i.e. **340px at the 1366px capture width** — the brief's figure checks out. | Design tokens in `04` are measured, not guessed. |

---

## 6. The icon decision

**F1** means the brief's "weather-icons (Erik Flowers), `wi-owm-*` classes" is not
achievable via `npm i weather-icons`. Options were put to the operator, who chose:

> **Keep `weather-icons@1.3.2` and hand-write the OWM-code → class map.**

The map lives in `components/weather/iconClass.ts`, takes `(iconCode, isDay)` — primitives
only, so it does not breach the boundary rule — and branches on the OWM range rather than
enumerating 61 codes. The full table is in `02-current-weather.md`. Every class name in it
has been verified to exist in the installed 1.3.2 CSS.

## 7. Other departures from the original brief

Both were decided by the operator and must be reflected in the README written in `06`:

1. **Card background** — the brief says flat `rgba(255,255,255,.16)`. Pixel sampling shows
   the reference cards are a vertical gradient, roughly white 55% at the top fading to
   black 28% at the bottom. **The reference wins**, since Spec 4's acceptance criterion is
   visual fidelity.
2. **Disclaimer** — the reference has **two** disclaimer blocks, one pinned to the sidebar
   bottom and a second under the forecast grid. The brief mentions only the sidebar.
   **Both are built**, from a single component taking the copy as a prop. Both copy blocks
   are transcribed verbatim in `04-visual-layout.md`; they do not need to be requested.

## 8. Definition of done (whole suite)

- [ ] `pnpm install && pnpm dev` works on a clean machine
- [ ] `pnpm check` passes
- [ ] `pnpm build` passes
- [ ] `grep -r "NEXT_PUBLIC" .` does not return the key
- [ ] `grep -rE "temp_min|dt_txt|weather\[0\]" components/` returns nothing
- [ ] Layout compared side by side with the reference
- [ ] README with technical decisions

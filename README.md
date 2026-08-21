# Weather Forecast

A weather search application built with Next.js, React, TypeScript, TanStack Query,
Zod, Vitest, React Testing Library, and Cypress.

## Requirements

- Node.js 22
- pnpm 11.22.0
- An OpenWeather API key for the running application

## Getting Started

```bash
pnpm install
cp .env.example .env.local
```

Set `OPENWEATHER_API_KEY` in `.env.local`, then start the development server:

```bash
pnpm dev
```

Open http://localhost:3000.

The key intentionally has no `NEXT_PUBLIC_` prefix. It is read only on the server by the
OpenWeather adapter. A public environment variable would be included in the browser bundle
and visible to anyone using the application.

Tests use committed API fixtures and do not need an API key.

## Commands

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | Run ESLint with zero warnings allowed |
| `pnpm typecheck` | Run TypeScript without emitting files |
| `pnpm test` | Run the Vitest suite |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm e2e` | Run Cypress end-to-end tests |
| `pnpm check` | Run lint, typecheck, and unit tests |
| `pnpm quality` | Run check, build, dead-code, and circular-dependency checks |

## Technical Decisions

### Server-side API key

The OpenWeather key stays server-side because a `NEXT_PUBLIC_` variable is inlined into the
client bundle and can be read through browser developer tools. The key is read only by the
server-only OpenWeather adapter. Browser requests go to the application's own route handlers,
which never return the key or the upstream `appid` parameter.

### Adapter boundary

The adapter absorbs OpenWeather's hostile response shape: geocoding returns ambiguous matches,
forecast data arrives as forty three-hour blocks, temperatures are attached to individual
blocks, and conditions use numeric IDs plus day/night icon suffixes. The rest of the application
receives domain values instead of learning OpenWeather field names or grouping rules.

### Caching

Geocoding uses a thirty-day cache because city coordinates change rarely. Current weather and
forecast use a ten-minute cache because conditions change frequently. The cache durations live
in the upstream fetch options and are asserted by adapter tests; the client query cache has
separate millisecond stale-time constants. This distinction prevents mixing server revalidation
seconds with client freshness milliseconds.

### Separate geocoding

Geocoding is a separate request because a city name is not a unique location. `Springfield`
returns multiple matches and even `Chicago` can return cities in several countries. The user
must choose the intended city before weather data is requested.

### State management

TanStack Query owns server state, including loading, errors, caching, and deduplication. The
weather workflow hook owns only the search query, selected city, presentation unit, and query
results. A state library would add indirection for values that are local to one page.

### Temperature units

Weather data uses canonical Celsius in the domain and the provider always requests metric data.
The `°C`/`°F` choice is presentation state, defaulting to Fahrenheit to match the reference.
Conversion and locale-aware formatting happen at render time with `Intl.NumberFormat`, so a
unit toggle does not create a second server cache entry for the same city.

### Out of scope

There is no geolocation because city search is the defined product flow. There is no search
history, favourites, dark mode, or internationalized copy because they are outside the focused
assessment scope. There is no rate limiting because deployment-level controls are outside this
application slice. There is no visual-regression service or full accessibility audit; Cypress
covers behavior, while semantic markup and decorative-icon handling cover the required baseline.

## Deviations

### Weather icons

The installed `weather-icons@1.3.2` package does not contain the requested `wi-owm-*` classes,
and its stylesheet/font wiring was not active in the application. The non-functional icon map
and wrapper were removed rather than shipping blank glyphs. The debt and the exact restoration
work are recorded in [`specs/tech-debt.md`](specs/tech-debt.md), to be addressed with verified
font loading and visual validation.

### Card background

The brief describes a flat translucent card, but sampling the reference shows a vertical
white-to-black gradient. The implementation follows the reference because visual fidelity is
the acceptance criterion.

### Two disclaimers

The reference contains one disclaimer pinned to the sidebar and another below the forecast
grid. Both are implemented from the same `Disclaimer` component, even though the brief calls
out only the sidebar disclaimer.

## Architecture

```text
app/
  api/
    forecast/route.ts
    geocode/route.ts
    weather/route.ts
  layout.tsx
  page.tsx
  providers.tsx
  theme.css
components/
  ui/
  weather/
    client-facing components and hooks
lib/
  searchQuery/
  weather/
    client/
    openweather/
    schemas/
    temperature/
    types.ts
    provider.ts
test/
  factories/
  fixtures/
  http/
```

The boundaries are enforced by ESLint zones and CI greps. Components can use domain types and
client-safe weather helpers, but cannot import the OpenWeather adapter or raw schemas. The
weather library does not depend on React, Next.js, or components.

## Development Workflow

Behavioral work follows RED-GREEN-REFACTOR. Tests fail first for the intended assertion, the
smallest implementation makes them pass, and cleanup happens only while the suite remains
green. Unit and component tests use committed fixtures; Cypress intercepts application routes
and never calls OpenWeather.

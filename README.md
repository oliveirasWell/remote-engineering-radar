# Weather Forecast

City search with current conditions and a 5-day forecast.

**Live:** https://dev-pro-weather.vercel.app

![Weather Forecast](docs/screenshot.png)

## Stack

- **Next.js** — App Router, route handlers proxy OpenWeather so the API key stays server-side
- **React + TypeScript** — strict mode, no `any`
- **TanStack Query** — server state, caching, and deduplication
- **Zod** — validates raw provider responses at the adapter boundary
- **CSS Modules** — styling colocated with each component
- **Vitest + React Testing Library** — unit and component tests
- **Cypress** — end-to-end tests against intercepted routes
- **ESLint + Knip + Madge** — lint zones, dead code, and dependency cycles

## Requirements

- Node.js 22
- pnpm 11.22.0
- An OpenWeather API key

## Getting Started

```bash
pnpm install
cp .env.example .env.local
```

Set `OPENWEATHER_API_KEY` in `.env.local`, then:

```bash
pnpm dev
```

Open http://localhost:3000.

The key has no `NEXT_PUBLIC_` prefix on purpose — that would inline it into the browser bundle.
Tests run on committed fixtures and need no key.

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
| `pnpm deadcode` | Find unused files, dependencies, and exports |
| `pnpm circular` | Check the dependency graph for cycles |

## Architecture

```text
app/
  api/         # route handlers: geocode, weather, forecast
  page.tsx
components/
  ui/          # primitives
  weather/     # feature components, hooks, CSS Modules
  Disclaimer/
lib/
  searchQuery/
  weather/
    client/       # browser access to our route handlers
    openweather/  # server-only provider adapter
    schemas/      # raw provider validation
    temperature/  # canonical Celsius, presentation conversion
    types.ts      # domain data
    provider.ts   # provider port
cypress/
test/            # factories, fixtures, http, render helpers
```

Components use domain types and client helpers; they cannot import the OpenWeather adapter or
raw schemas. `lib/weather` does not depend on React or Next.js. ESLint zones and CI enforce it.

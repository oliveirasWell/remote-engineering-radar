# Spec 1 — The user can search for any city

> **AC:** "The user can search for any city and get the weather forecast."

Commit: `feat(spec-1): city search`.

## Gherkin

Copy this verbatim into a JSDoc block at the top of the test files for this slice. No
Cucumber preprocessor.

```
Feature: City search

  Scenario: user searches and sees matching cities
    Given I am on the home page
    When I type "Chicago" into the search field
    Then I see a list of matching cities
    And each result shows name, state and country

  Scenario: ambiguous city name
    When I search for "Springfield"
    Then I see more than one matching city

  Scenario: no match
    When I search for "asdfgh"
    Then I see a no-results message
```

---

## Layer 0 — Fixtures

Capture from the live API **once**, commit the raw JSON, and never call the network from a
test again.

```bash
zsh -ic '
  B=https://api.openweathermap.org/geo/1.0/direct
  D=lib/weather/fixtures
  mkdir -p $D
  curl -s "$B?q=chicago&limit=5&appid=$OPENWEATHER_API_KEY"     > $D/geocode-chicago.json
  curl -s "$B?q=springfield&limit=5&appid=$OPENWEATHER_API_KEY" > $D/geocode-springfield.json
  curl -s "$B?q=asdfgh&limit=5&appid=$OPENWEATHER_API_KEY"      > $D/geocode-empty.json
'
```

Then confirm nothing sensitive landed in them — the geocode response contains no secrets,
but check anyway:

```bash
grep -rl "appid" lib/weather/fixtures/   # must return nothing
```

### What the real payload actually looks like

Verified live (**F7**, **F8**). This is a top-level **array**:

```json
[
  {
    "name": "Chicago",
    "local_names": { "qu": "Chicago", "nn": "Chicago", "be": "Чыкага" },
    "lat": 41.8755616,
    "lon": -87.6244212,
    "country": "US",
    "state": "Illinois"
  },
  { "name": "Chicago", "lat": -33.71745, "lon": 18.9963167, "country": "ZA", "state": "Western Cape" }
]
```

Four traps, all confirmed against real responses:

1. **`local_names` is optional.** Only the first Chicago result has it; the other four
   omit the key entirely. A schema requiring it rejects real data.
2. **`local_names` has 129 keys** on the Chicago entry and is never displayed. Do not
   model its contents — `z.record(z.string(), z.string()).optional()` or simply omit it
   from the schema and let it be stripped.
3. **`state` is absent for many cities** and is the **full name** when present —
   `"Illinois"`, not `"IL"`.
4. **`name` casing is not normalised upstream.** The Kenyan result comes back as
   `"chicago"`, lowercase. Display it as received; do not "fix" it.

> **ASK — state abbreviation.** Spec 2's Gherkin says the user selects
> `"Chicago, IL, US"`, but the API returns `"Illinois"`. Recommendation: render the API
> value verbatim (`Chicago, Illinois, US`) and treat `IL` in the Gherkin as shorthand. A
> full-name→abbreviation table is 50+ US-only entries that break for `Western Cape` and
> `Suchitepéquez`. Confirm before writing the assertion, since it decides the exact string
> the component test looks for.

Also note "Chicago" itself returns **5 countries** (US, ZA, ZW, GT, KE), so the
disambiguation UI matters even for the headline scenario.

---

## Layer 1 — Schema and domain types

`lib/weather/schemas.ts`, `lib/weather/types.ts`.

**RED.** `lib/weather/schemas.test.ts`:

- The Chicago fixture parses successfully and yields 5 entries.
- The Springfield fixture parses successfully.
- The empty fixture parses to `[]`.
- An entry **without** `state` parses (build the object inline; do not edit a fixture).
- An entry **without** `local_names` parses.
- A malformed entry — `lat` as a string, or `country` missing — is **rejected**.

**GREEN.** Define `geocodeResponseSchema` and export the raw type via `z.infer`. The raw
type stays in the adapter layer; it is never imported by `components/**`.

Write `CityMatch` and the `WeatherProvider` interface into `types.ts` now, exactly as
given in `specs/README.md` §3. Hand-written — do not derive them from the API shape.

> Only `searchCities` needs to exist on the provider at this point. Declaring
> `getCurrent`/`getForecast` in the interface is fine (it is the contract), but do not
> implement them — that is Specs 2 and 3.

---

## Layer 2 — Adapter

`lib/weather/openweather.ts`. Starts with `import 'server-only';`.

**RED.** `lib/weather/openweather.test.ts`, with `fetch` stubbed via
`vi.stubGlobal('fetch', ...)` and the fixtures as response bodies:

- Maps the Chicago fixture to 5 `CityMatch` objects.
- `id` is `` `${lat},${lon}` `` — assert the literal `"41.8755616,-87.6244212"`.
- `state` is `undefined`, not `null` or `""`, when the upstream key is absent.
- Returns `[]` for the empty fixture.
- Throws a **typed** error on a non-ok response. Use 401, which is what a bad key really
  returns (**F7**).
- Rejects a malformed payload rather than passing it through.
- Calls `/geo/1.0/direct` with the query, `limit`, the key, and
  `next: { revalidate: 2592000 }` (**F4** — a positive `revalidate` does cache in this
  repo; do not "fix" it). Geocoding takes no `units` parameter — that belongs to the 2.5
  endpoints in Specs 2 and 3.

> If this test file errors with *"This module cannot be imported from a Client Component
> module"*, the `server-only` alias from `00-scaffold` §0.4 is missing or wrong (**F2**).
> That is not a valid RED — fix the config and re-run.

Assert the **request**, not just the response: read the URL passed to the stub and check
it contains the query and the key. Then assert the *returned* `CityMatch[]` does **not**.

**GREEN.** Implement `searchCities`. A single typed error class (e.g.
`WeatherProviderError` carrying `status`) is enough; do not build an error hierarchy.

---

## Layer 3 — Route handler

`app/api/geocode/route.ts`.

**RED.** `app/api/geocode/route.test.ts` — import `GET` directly and call it with a
`Request`. This runs in the default `node` environment, where `Request`/`Response` are the
real Web APIs.

- `?q=a` → **400** (under 2 characters). Also `?q=` and a missing `q`.
- `?q=%20%20Chi%20%20cago%20%20` → the provider receives the **normalized** query. Assert
  on the argument the mocked provider was called with: trimmed, lowercased, internal
  whitespace collapsed to a single space. Normalization happens **before** the provider
  call, not inside the adapter.
- Valid query → 200 and a JSON array of `CityMatch`.
- Provider throws → **502**, with a body that does not leak the upstream message verbatim.
- **Leak test:** for every response produced in this file, the serialized body contains
  neither the value of `OPENWEATHER_API_KEY` nor the substring `appid`. Read the key from
  `process.env` inside the test; never hardcode it.

**GREEN.** Implement the handler. Mock the provider module rather than `fetch` here — this
layer's job is validation, normalization and status mapping, not HTTP.

> Route Handlers are not cached and `fetch` memoization does not apply inside them
> (**F5**). Do not add `export const dynamic`. The caching that matters is on the upstream
> fetch in the adapter.

---

## Layer 4 — Components

`components/ui/Input.tsx`, `components/ui/Spinner.tsx`,
`components/weather/SearchPanel.tsx`, `components/weather/CityResults.tsx`.

Component test files start with:

```ts
// @vitest-environment jsdom
```

**RED.** `components/weather/CityResults.test.tsx`:

- Renders **nothing** for an empty list — no empty `<ul>`, no stray wrapper. Assert the
  container is empty or the list role is absent.
- Renders one entry per `CityMatch`, each showing name, state and country.
- An entry without `state` renders without a dangling separator (no `"Chicago, , KE"`).
- Clicking an entry calls `onSelect` with **that** `CityMatch` object.
- Renders a no-results message when given an empty list **and** a flag indicating a search
  ran — an empty list before any search is not "no results". Decide the prop shape here
  and keep it; the E2E in `04` asserts this message.

`components/weather/SearchPanel.test.tsx`:

- Renders the "Search" heading and an input with placeholder `Search by city`.
- Typing calls the change handler.

`components/ui/Input.tsx` takes primitive props only — no `CityMatch`, no domain types
(§3 boundary rule).

**GREEN.** Build them. Presentational only: `CityResults` receives a list and a callback,
it does not fetch.

---

## Layer 5 — TanStack Query wiring

`app/providers.tsx`, and the hook that calls `/api/geocode`.

**RED.**

- `staleTime` prevents a refetch for the same query key: render, search `"chicago"`,
  unmount, re-render with the same key, assert `fetch` was called once. Use a fresh
  `QueryClient` per test with `retry: false`.
- Loading state renders the spinner.
- Error state renders an error message.
- The query does not fire for inputs under 2 characters — mirror the route's rule client
  side so the 400 is never provoked in normal use.

**GREEN.** `providers.tsx` is a Client Component exporting `QueryClientProvider`, wired
into `app/layout.tsx`. The `QueryClient` must be created inside a `useState` initializer,
not at module scope — a module-scope client is shared across requests on the server.

---

## Done means

- [ ] Every layer went RED with a real assertion failure before GREEN
- [ ] Three fixtures committed under `lib/weather/fixtures/`, captured from the live API
- [ ] `searchCities` maps, returns `[]`, throws typed on 401, rejects malformed payloads
- [ ] `/api/geocode` returns 400 under 2 chars, normalizes before calling the provider, 502 on upstream failure
- [ ] Leak test passes: no response body contains the key or `appid`
- [ ] `CityResults` renders nothing for `[]` and calls `onSelect` with the clicked match
- [ ] `staleTime` demonstrably prevents a duplicate fetch
- [ ] No test hits the network
- [ ] `pnpm check` green
- [ ] The **ASK** on state abbreviation was resolved before the component assertion was written
- [ ] Committed as `feat(spec-1): city search`

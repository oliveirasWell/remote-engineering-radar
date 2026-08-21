# Spec 6 — README and technical decisions

Commit: `feat(spec-6): readme and technical decisions`.

Replace the `create-next-app` boilerplate `README.md` entirely.

---

## Part 1 — Run instructions

Enough for a clean machine, in this order:

- Prerequisites: Node 22+, pnpm 11.22.0 (declared in `packageManager`).
- `pnpm install`
- Get an OpenWeather API key; copy `.env.example` to `.env.local` and set
  `OPENWEATHER_API_KEY`. State plainly that it is **not** `NEXT_PUBLIC_` and why.
- `pnpm dev` → http://localhost:3000
- Command table: `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:watch`,
  `e2e`, `check`.
- Note that `pnpm check` and CI need no API key, because tests run against committed
  fixtures.

## Part 2 — Technical decisions

The brief asks for six arguments. Each is a short paragraph making an actual case, not a
restatement of what the code does.

1. **Why the API key stays server-side.** A `NEXT_PUBLIC_` variable is inlined into the
   client bundle and readable by anyone who opens devtools. The key is read only in
   `lib/weather/openweather.ts`, which carries `import 'server-only'` so the boundary is
   enforced by the build rather than by discipline. The browser talks to our own routes,
   which never echo the key — covered by the leak tests in Specs 1 and 2.

2. **Why the adapter exists.** Not "so we can swap providers" — that is a hypothetical and
   nobody is swapping. The real reason is that OpenWeather's shape is hostile to the UI:
   forty three-hour blocks instead of days, `temp_min` per block rather than per day,
   condition as a numeric id plus a `d`/`n` icon suffix, a timezone offset delivered
   separately from the timestamps. The adapter is where that is absorbed, so components
   receive `ForecastDay[]` and never learn what `dt_txt` is. The `import/no-restricted-paths`
   rule and the `grep -rE "temp_min|dt_txt|weather\[0\]" components/` gate are what keep the
   claim true over time.

3. **Caching strategy and why the TTLs are asymmetric.** Geocoding is cached 30 days
   because a city's coordinates do not change; weather and forecast are cached 600s because
   they do. Different volatility, different TTL. Mention that Next 16 made caching opt-in,
   that `cacheComponents` is off in this project so the previous model applies, and that
   a positive `next.revalidate` therefore does cache — and that this was confirmed by
   observation in Spec 5, not assumed.

4. **Why geocoding is a separate call.** `q=` on the 2.5 endpoints returns one arbitrary
   match. "Springfield" is genuinely ambiguous — five US states — and even "Chicago"
   returns results in five countries. Only the user can disambiguate, so the UI has to show
   the list. That is a product requirement driving an extra round trip, and it is why the
   30-day geocode cache matters: the extra call is nearly free after the first.

5. **State management and why no state library.** The client state is one selected city and
   one query string. TanStack Query owns the server state — caching, loading, errors,
   deduplication — which is the part that is actually hard. What remains is two `useState`
   calls. Redux or Zustand here would add a store, actions and a provider to hold a value
   that a single `useState` holds correctly.

6. **What was left out of scope, with justification.** Be honest and specific. Candidates:
   no geolocation, no unit toggle (the reference is Fahrenheit), no search history or
   favourites, no dark mode, no i18n despite `local_names` being available, no rate
   limiting on the routes, no visual-regression testing, no error boundary beyond per-query
   error states, no accessibility audit beyond semantic markup and decorative-icon
   handling. Say why each was cut — scope, not oversight.

## Part 3 — Deviations from the brief

These must be stated plainly. An assessor comparing the brief to the code will find them
anyway; explaining them is the difference between a decision and a mistake.

1. **`wi-owm-*` classes do not exist in the installed package.** The brief specifies
   weather-icons with `wi-owm-*` classes. npm's `weather-icons` has exactly one published
   version, 1.3.2 (2015), whose CSS defines 177 `.wi-*` classes and zero `wi-owm-*` ones —
   that mapping only shipped in Erik Flowers' v2.x, which was never published under that
   name. Options were to switch to the `weathericons@2.1.0` package, vendor the v2 CSS, or
   keep 1.3.2 and map the codes. **Kept 1.3.2 and hand-wrote the map** in
   `components/weather/iconClass.ts`, branching on OWM condition ranges. Note the map is
   unit-tested per range and boundary.

2. **Card background is a gradient, not flat.** The brief says
   `rgba(255,255,255,.16)`. Sampling the reference shows the cards read lighter than the
   background at the top and *darker* at the bottom, which a white overlay cannot produce.
   Implemented as the measured vertical gradient, because Spec 4's acceptance criterion is
   fidelity to the reference.

3. **Two disclaimers, not one.** The reference has a long block pinned to the sidebar
   bottom and a second under the forecast grid. The brief describes only the sidebar.
   Built both from one `Disclaimer` component taking the copy as a prop.

Also worth a line: the reference's temperature measures larger than the brief's "around
96px" — state the value actually shipped after the side-by-side.

## Part 4 — Architecture note

Short. The `app` / `components` / `lib` split, the boundary rules, and the fact that they
are machine-enforced (ESLint zones + CI greps) rather than conventional. A directory tree
helps; a paragraph of prose about "clean architecture" does not.

---

## Done means

- [ ] Boilerplate README fully replaced
- [ ] A clean-machine reader can install, configure the key, and run the app from the README alone
- [ ] All six required arguments present, each making a case rather than describing code
- [ ] All three deviations documented, with the reasoning
- [ ] Cache observation from Spec 5 recorded
- [ ] Out-of-scope list is specific and justified
- [ ] No stale `create-next-app` text anywhere in the file
- [ ] Committed as `feat(spec-6): readme and technical decisions`

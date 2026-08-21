# Spec 2 — The user sees the current weather

> **AC:** "In the search result, the user can see the current weather status."

Commit: `feat(spec-2): current weather`.

## Gherkin

```
Feature: Current weather

  Scenario: user selects a city and sees current conditions
    Given I searched for "Chicago"
    When I select "Chicago, IL, US" from the results
    Then I see the city name
    And I see the current temperature in Fahrenheit
    And I see an icon matching the current condition
```

> The `"Chicago, IL, US"` string depends on the **ASK** resolved in `01` — the API returns
> `"Illinois"`, not `"IL"`. Use whatever was decided there; do not re-litigate it here.

---

## Layer 0 — Fixture

```bash
zsh -ic '
  curl -s "https://api.openweathermap.org/data/2.5/weather?lat=41.8755616&lon=-87.6244212&units=imperial&appid=$OPENWEATHER_API_KEY" \
    > lib/weather/fixtures/current-chicago.json
'
```

Real response, verified live:

```json
{
  "coord": { "lon": -87.6206, "lat": 41.8758 },
  "weather": [{ "id": 803, "main": "Clouds", "description": "broken clouds", "icon": "04n" }],
  "base": "stations",
  "main": { "temp": 65.44, "feels_like": 65.59, "temp_min": 62.2, "temp_max": 68.18,
            "pressure": 1018, "humidity": 83, "sea_level": 1018, "grnd_level": 996 },
  "visibility": 10000,
  "wind": { "speed": 0, "deg": 0 },
  "clouds": { "all": 55 },
  "dt": 1787291095,
  "sys": { "type": 2, "id": 2021194, "country": "US",
           "sunrise": 1787310299, "sunset": 1787359358 },
  "timezone": -18000,
  "id": 4887398,
  "name": "Chicago",
  "cod": 200
}
```

Points that matter:

- `weather` is an **array**; only `weather[0]` is used. It is never empty in practice, but
  the schema should require at least one element so a truncated payload fails loudly.
- `main.temp` is a float (`65.44`) — the domain type carries it **already rounded**.
- `name` is the city name; use it for `CurrentWeather.city`.
- `timezone` is `-18000` (UTC-5). Not needed here — it matters in `03`.

---

## Layer 1 — Schema

**RED.** Extend `lib/weather/schemas.test.ts`:

- The fixture parses.
- A payload with `weather: []` is **rejected**.
- A payload missing `main.temp` is **rejected**.
- Unknown extra keys do not break parsing (OpenWeather adds fields over time —
  `sea_level`/`grnd_level` are recent additions and are not modelled).

**GREEN.** `currentWeatherResponseSchema` + `z.infer` raw type. Model only the fields the
adapter reads: `weather[0].id`, `weather[0].description`, `weather[0].icon`, `main.temp`,
`name`. Do not model `wind`, `clouds`, `visibility`, `sys` — unused shape is unmaintained
shape.

---

## Layer 2 — Adapter `getCurrent`

**RED.** Extend `lib/weather/openweather.test.ts`:

- Maps the fixture to a `CurrentWeather`.
- `temp` is `65` — **rounded**, not truncated. Add a second case proving rounding rather
  than flooring: a payload with `temp: 65.5` yields `66`.
- `iconCode` is `803`, carried from `weather[0].id`.
- `condition` comes from `weather[0].description`.
- `isDay` is `false` for the fixture (`icon: "04n"`), and `true` for a payload with
  `icon: "04d"`.
- The upstream URL contains `units=imperial` and `next: { revalidate: 600 }`.
- Non-ok upstream → the same typed error as `01`.

**GREEN.**

`isDay` derives from the **last character of `weather[0].icon`** — OpenWeather suffixes
every icon code with `d` or `n` (verified: `"04n"`). This is the cheapest correct signal;
comparing `dt` against `sys.sunrise`/`sys.sunset` gets the same answer with more code and
more edge cases.

`weather[0].icon` is a raw API field. It is read **only here, in the adapter**. It must
never reach `components/**` — the §7 grep gate (`weather\[0\]`) enforces that.

---

## Layer 3 — Route handler

`app/api/weather?lat=&lon=`.

**RED.** `app/api/weather/route.test.ts`:

- Missing `lat` or `lon` → **400**.
- Non-numeric (`lat=abc`) → **400**. Note `Number("")` is `0`, so an empty string must be
  rejected explicitly rather than by `isNaN` alone.
- Out of range (`lat=91`, `lat=-91`, `lon=181`, `lon=-181`) → **400**.
- Valid coordinates → 200 with a `CurrentWeather` body.
- Provider throws → **502**.
- Leak test again: no key, no `appid` in the body.

**GREEN.** Implement. Validate with Zod using `z.coerce.number()` plus `.min()`/`.max()`,
which handles the string-to-number step and the range in one place.

---

## Layer 4 — Icon map

`components/weather/iconClass.ts`.

**Read `specs/README.md` §6 first.** The brief says `wi-owm-*`. The installed package
(`weather-icons@1.3.2`, the only published version) contains **zero** such classes
(**F1**). The operator's decision is to keep 1.3.2 and hand-write the map.

Branch on the OWM condition range, not on 61 individual codes. Every class below was
verified to exist in the installed CSS:

| OWM `weather[0].id` | Group | `isDay: true` | `isDay: false` | Day-neutral (forecast) |
|---|---|---|---|---|
| `200`–`299` | Thunderstorm | `wi-day-thunderstorm` | `wi-night-alt-thunderstorm` | `wi-thunderstorm` |
| `300`–`399` | Drizzle | `wi-day-sprinkle` | `wi-night-alt-sprinkle` | `wi-sprinkle` |
| `500`–`599` | Rain | `wi-day-rain` | `wi-night-alt-rain` | `wi-rain` |
| `600`–`699` | Snow | `wi-day-snow` | `wi-night-alt-snow` | `wi-snow` |
| `700`–`799` | Atmosphere | `wi-day-fog` | `wi-night-fog` | `wi-fog` |
| `800` | Clear | `wi-day-sunny` | `wi-night-clear` | `wi-day-sunny` |
| `801`–`899` | Clouds | `wi-day-cloudy` | `wi-night-alt-cloudy` | `wi-cloudy` |
| anything else | — | `wi-cloudy` | `wi-cloudy` | `wi-cloudy` |

The fallback is `wi-cloudy` because **1.3.2 has no `wi-na`** — that class only exists in
v2. Do not reference it.

The day-neutral column is used by `03`: `ForecastDay` has no `isDay` field, so forecast
cards cannot pick a day/night variant. Add that column now only if `03` is next; otherwise
implement the two-argument form and extend it there.

**RED.** `components/weather/iconClass.test.ts`:

- One case per range, day and night — `(803, false)` → `wi-night-alt-cloudy`,
  `(800, true)` → `wi-day-sunny`, `(500, true)` → `wi-day-rain`, etc.
- Boundary codes: `200`, `299`, `300`, `800`, `801`.
- An unmapped code (`999`, `0`) → `wi-cloudy`.

This function takes `(number, boolean)` and returns a string. Primitives only, so it does
not breach the boundary rule despite living under `components/`.

---

## Layer 5 — Component

`components/weather/CurrentWeather.tsx`, `components/weather/WeatherIcon.tsx`.

**RED.** `components/weather/CurrentWeather.test.tsx`, `// @vitest-environment jsdom`:

- Given **literal props** (`{ city: 'Chicago', temp: 80, condition: 'clear sky',
  iconCode: 800, isDay: true }`), renders `Chicago` and `80°`.
- The icon element carries `wi` **and** `wi-day-sunny`.
- With `isDay: false`, it carries `wi-night-clear`.
- The icon is not announced to screen readers as content — it is decorative, so
  `aria-hidden="true"`, with the condition text available as the accessible description.

Props are the domain type, never raw API shape. The test must be constructible without
importing a fixture — that is the proof the boundary holds.

**GREEN.** Build both. `WeatherIcon` renders `<i className={...} aria-hidden="true" />`.

---

## Layer 6 — Selection triggers the fetch

**RED.**

- Selecting a city from `CityResults` triggers the current-weather query with that city's
  `lat`/`lon`.
- Loading state renders the spinner.
- Error state renders an error message.
- No city selected → no fetch fires.

**GREEN.** Lift the selected `CityMatch` into `useState` in the page, pass it down.
`useQuery` with `enabled: selected !== null`. No state library — `useState` and props, per
the stack.

---

## Done means

- [ ] Every layer went RED with a real assertion failure before GREEN
- [ ] `current-chicago.json` committed
- [ ] `getCurrent` rounds (proved with `.5`), derives `isDay` from the `d`/`n` suffix, carries `iconCode` from `weather[0].id`
- [ ] `/api/weather` rejects missing, non-numeric, empty-string and out-of-range coordinates with 400; 502 on upstream failure
- [ ] Leak test passes
- [ ] Icon map covers every range plus boundaries plus the `wi-cloudy` fallback
- [ ] `CurrentWeather` renders from literal domain props with no fixture import
- [ ] `grep -rE "temp_min|dt_txt|weather\[0\]" components/` returns nothing
- [ ] `pnpm check` green
- [ ] Committed as `feat(spec-2): current weather`

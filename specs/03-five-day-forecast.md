# Spec 3 — The user sees the next 5 days

> **AC:** "The user can see the weather for the next 5 days."

Commit: `feat(spec-3): five-day forecast`.

## Gherkin

```
Feature: Five-day forecast

  Scenario: user sees the five-day outlook
    Given I selected "Chicago, IL, US"
    Then I see 5 forecast cards
    And the first card is labelled "Today"
    And each card shows a low and a high temperature
```

---

## Layer 0 — Fixture

```bash
zsh -ic '
  curl -s "https://api.openweathermap.org/data/2.5/forecast?lat=41.8755616&lon=-87.6244212&units=imperial&appid=$OPENWEATHER_API_KEY" \
    > lib/weather/fixtures/forecast-chicago.json
'
```

Shape, verified live:

```json
{
  "cod": "200", "message": 0, "cnt": 40,
  "list": [
    {
      "dt": 1787292000,
      "main": { "temp": 64.99, "temp_min": 64.2, "temp_max": 65.95, ... },
      "weather": [{ "id": 803, "main": "Clouds", "description": "broken clouds", "icon": "04n" }],
      "clouds": { "all": 55 }, "wind": {...}, "visibility": 10000,
      "pop": 0, "sys": { "pod": "n" },
      "dt_txt": "2026-08-21 06:00:00"
    }
  ],
  "city": { "name": "Chicago", "timezone": -18000, "sunrise": ..., "sunset": ... }
}
```

- `cnt` is `40`, and `list.length` is `40` — forty **three-hour blocks**, not days.
- `city.timezone` is `-18000` seconds = **UTC-5**.
- `dt_txt` is a UTC string. It is convenient and it is a trap: parsing it as local time is
  precisely the bug this spec exists to prevent. **Group on `dt` (the epoch), not on
  `dt_txt`.**
- `dt_txt` is a raw API field and must never reach `components/**` (§7 grep gate).

### FREEZE THE FIXTURE

The numbers below came from a capture at 06:00 UTC. **Your capture will be at a different
hour and will produce different day boundaries and block counts.** Capture once, commit it,
and never re-capture. Then derive the expected values *from your committed fixture* and
write them into the test as literals. Do not copy the illustrative numbers below into
assertions.

To derive them after capturing:

```bash
node -e '
const f=require("./lib/weather/fixtures/forecast-chicago.json"), tz=f.city.timezone;
const g=new Map();
for(const b of f.list){
  const d=new Date((b.dt+tz)*1000), k=d.toISOString().slice(0,10);
  if(!g.has(k)) g.set(k,[]); g.get(k).push(b);
}
console.log("local groups:", g.size);
for(const [k,v] of g) console.log(k, "blocks="+v.length,
  "low="+Math.min(...v.map(b=>b.main.temp_min)),
  "high="+Math.max(...v.map(b=>b.main.temp_max)));
const utc=new Set(f.list.map(b=>new Date(b.dt*1000).toISOString().slice(0,10)));
console.log("UTC groups:", utc.size, "<- must differ from local, or pick a better fixture");
'
```

**Illustrative only** — the 06:00 UTC capture produced:

| local date | blocks | low | high |
|---|---|---|---|
| 2026-08-21 | 8 | 62.98 | 78.93 |
| 2026-08-22 | 8 | 67.10 | 81.03 |
| 2026-08-23 | 8 | 68.63 | 76.64 |
| 2026-08-24 | 8 | 65.62 | 77.27 |
| 2026-08-25 | 8 | 66.22 | 75.90 |

→ **5 local groups. Grouping the same 40 blocks by UTC gives 6.**

That asymmetry is the timezone test. Note it runs the opposite way to the naive
expectation: correct local grouping *collapses* to 5 here, while the buggy UTC grouping
*splits* into 6. If your capture yields 6 local groups (a partial first day), that is also
valid — take the first 5 and expect `isPartial: true` on day 0.

---

## Layer 1 — `aggregate.ts`, the pure function

`lib/weather/aggregate.ts`. This is the heart of the spec and gets the most tests.

```ts
export function aggregate(blocks: RawForecastBlock[], timezoneOffsetSeconds: number): ForecastDay[]
```

**The offset is a parameter and there is no clock read inside.** `"Today"` is the label at
index 0 *by definition*, not by comparing anything to `Date.now()`. This is what makes the
function testable without fake timers, and it is why the signature does not take the whole
response object.

### Algorithm

1. **Shift, then group.** Local day key for a block:
   ```ts
   new Date((block.dt + timezoneOffsetSeconds) * 1000).toISOString().slice(0, 10)
   ```
   Local hour, from the same shifted value: `.getUTCHours()`. Using `getHours()` or
   `getDate()` reintroduces the runner's timezone — that is the bug.
2. **Preserve chronological order** of groups. Use a `Map` (insertion-ordered) or sort the
   keys; do not rely on plain-object key ordering.
3. **Take the first 5 groups**, after grouping. 40 blocks can produce 5 or 6 local groups
   depending on capture time.
4. `low` = min of `main.temp_min` across **all** blocks of that day; `high` = max of
   `main.temp_max`. Not the first block, not the noon block.
5. `iconCode` = `weather[0].id` of the block whose **local hour is nearest 12**. Ties
   resolve to the **earlier** block.
6. `label`: index `0` → `"Today"`. Otherwise the weekday name:
   ```ts
   new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'UTC' }).format(shifted)
   ```
   `timeZone: 'UTC'` is mandatory — the value is already shifted, so letting `Intl` apply
   the runner's zone shifts it twice and CI in another region produces different weekday
   names than your machine.
7. `isPartial`: `true` when that day has fewer than 8 blocks. In practice only day 0 or the
   last day can be partial.
8. `date`: the `YYYY-MM-DD` key from step 1.

> Rounding: the brief specifies rounding only for `CurrentWeather.temp`. `ForecastDay.low`
> and `high` are typed `number` with no such note. **ASK** whether to round them. The
> reference design shows whole degrees (`69°`, `81°`), so rounding here is the likely
> intent — but confirm rather than assume, and keep rounding out of `aggregate` if the
> answer is "format at the edge".

### RED — `lib/weather/aggregate.test.ts`

Against the committed fixture:

- 40 blocks collapse to **at most 5** `ForecastDay` entries.
- Grouping is by **local** day. The assertion must be one that *fails* if the offset is
  dropped. Two candidate discriminators — use whichever your frozen fixture exhibits, and
  confirm with the `node -e` snippet above before writing it:
  - **Group count.** In the illustrative capture, local grouping gives 5 groups and UTC
    grouping gives 6, so `expect(result).toHaveLength(5)` fails under the buggy path.
  - **Day-0 key.** When the capture straddles local midnight, `date[0]` under local
    grouping differs from the UTC day of block 0. This does *not* hold in the illustrative
    capture (06:00 UTC − 5h is 01:00 the same day, so both read `2026-08-21`) — which is
    exactly why you must check rather than assume.

  Verify the chosen assertion actually discriminates: temporarily pass `0` as the offset
  and confirm the test goes red. An assertion that passes with and without the offset is
  not testing the timezone.
- `low`/`high` for each day equal the min/max across that day's blocks (literals derived
  from your fixture).
- `label[0]` is `"Today"`; `label[1..4]` are weekday names matching the frozen dates.
- Every `date` is `YYYY-MM-DD`.

Deterministic synthetic cases, independent of capture time — build these block arrays by
hand:

- **Noon icon:** a day whose blocks carry different `weather[0].id`, where the block
  nearest local noon has a distinctive id. Assert that id is chosen — **not** the first
  block's. Include a case where the first and noon blocks differ, or the test passes
  vacuously.
- **Tie-break:** two blocks equidistant from local noon → the earlier one wins. (With
  3-hour UTC-aligned blocks a true tie is not reachable, so this rule only ever fires on
  synthetic input. Specify and test it anyway so the behaviour is pinned rather than
  incidental.)
- **Partial first day:** a first group with 3 blocks → `isPartial: true`, and a full
  8-block group → `false`.
- **Six groups:** 41+ blocks spanning 6 local days → exactly 5 returned.
- **Non-hour offset:** `timezoneOffsetSeconds = 19800` (UTC+5:30, India) groups correctly.
  Offsets are not all whole hours.

---

## Layer 2 — Schema + `getForecast`

**RED.** Extend `lib/weather/schemas.test.ts`:

- The fixture parses; `list` has 40 entries; `city.timezone` is a number.
- A block missing `main.temp_min` is **rejected**.
- `list: []` is **rejected** — an empty forecast is an upstream failure, not a valid state.

Extend `lib/weather/openweather.test.ts`:

- `getForecast` validates, calls `aggregate` with `city.timezone`, and returns
  `ForecastDay[]`.
- The upstream URL carries `units=imperial` and `next: { revalidate: 600 }`.
- Non-ok upstream → the typed error.

**GREEN.** `getForecast` is thin: fetch → parse → `aggregate(parsed.list, parsed.city.timezone)`.
All the logic lives in the pure function, already tested.

> Extend `/api/weather` to return the forecast alongside the current conditions, or add a
> separate route — **ASK** which. The brief lists only `app/api/weather/route.ts`, which
> suggests one route returning both. One route means one round trip and one loading state;
> it also couples two cache TTLs that happen to be identical (600s), so nothing is lost.
> Recommendation: one route returning `{ current, forecast }`.

---

## Layer 3 — Components

`components/weather/ForecastCard.tsx`, `components/weather/ForecastGrid.tsx`.

**RED.** `// @vitest-environment jsdom`

`ForecastCard.test.tsx` — from **literal domain props**, no fixture import:

- Renders `label`, `low` and `high`, each with the `L` / `H` prefix shown in the reference.
- Renders the icon with the correct class.
- `isPartial: true` renders whatever was decided for that state — **ASK**: the brief
  requires the flag on the domain type but never says what the UI does with it. Options:
  ignore it visually, or mark the card. Do not invent a treatment.

`ForecastGrid.test.tsx`:

- Renders exactly **5** cards given 5 days.
- The first card is labelled `"Today"`.
- Given fewer than 5 days, renders that many — it does not pad with blanks.

**Forecast icons use the day-neutral column** of the map in `02`, because `ForecastDay`
carries no `isDay`. Extend `iconClass.ts` with a day-neutral form and test it here:
`803` → `wi-cloudy`, `800` → `wi-day-sunny`, `500` → `wi-rain`.

---

## Done means

- [ ] Every layer went RED with a real assertion failure before GREEN
- [ ] `forecast-chicago.json` captured once, committed, frozen; expectations derived from it
- [ ] `aggregate` is pure, takes the offset as a parameter, and reads no clock
- [ ] Local-vs-UTC grouping is proved by an assertion that fails under UTC grouping
- [ ] `low`/`high` are min/max across all blocks of the day
- [ ] `iconCode` comes from the block nearest local noon, proved against a differing first block
- [ ] `label[0] === "Today"`, the rest are weekday names, stable under `TZ=Asia/Tokyo pnpm test`
- [ ] `isPartial` true for a first day under 8 blocks
- [ ] 6 local groups still yield 5 days
- [ ] Non-hour offset (`19800`) handled
- [ ] `ForecastGrid` renders exactly 5 cards
- [ ] `grep -rE "temp_min|dt_txt|weather\[0\]" components/` returns nothing
- [ ] Both **ASK**s resolved before the assertions were written
- [ ] `pnpm check` green
- [ ] Committed as `feat(spec-3): five-day forecast`

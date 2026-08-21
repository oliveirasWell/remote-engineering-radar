# Spec 4 — The UI matches the reference

> **AC:** "Using CSS, style the front-end application to match the provided reference file
> as closely as possible."

Commit: `feat(spec-4): visual layout`.

Reference: `docs/reference.png` (moved there in `00-scaffold`; originally
`2026-08-21_01-42.png`). It is 1319×871, captured at a **1366px viewport** — so image
pixels scale to CSS pixels by `÷ 0.96559` (**F10**). Every number below is already
converted.

## Gherkin

```
Feature: Visual layout

  Scenario: the page matches the reference design
    Given I am on the home page
    Then I see a fixed-width sidebar and a gradient panel
    And the disclaimer sits at the bottom of the sidebar
    And the layout holds at 1280px and 1440px
```

---

## Design tokens

All of these are sampled from the reference, not guessed. They go in `app/theme.css` as
custom properties. **No hardcoded colors, radii or spacing in the CSS Modules** — every
value in a `.module.css` file references a token.

### Color

| Token | Value | Note |
|---|---|---|
| `--color-sidebar-bg` | `#f7f7f7` | Sampled `#f8f8f8`; the brief says `#f7f7f7`. Difference is imperceptible — use the brief's. |
| `--color-panel-from` | `#0168c3` | Gradient start, sampled at the top edge |
| `--color-panel-to` | `#52d9ff` | Gradient end, sampled at the bottom edge |
| `--color-text` | `#1a1a1a` | Sidebar headings and both disclaimers |
| `--color-on-panel` | `#ffffff` | Panel headings, city, temperature, card text |
| `--color-input-border` | `#aeaeae` | Sampled |
| `--color-input-bg` | `#ffffff` | |

The panel gradient is **linear and vertical**. Sampling at 25/50/75% matched a linear ramp
to within one 8-bit step, so:

```css
background: linear-gradient(180deg, var(--color-panel-from), var(--color-panel-to));
```

### Card background — deviation from the brief

The brief specifies flat `rgba(255,255,255,.16)`. Pixel sampling down a clean column of
card 1 shows a **vertical gradient**: over the dark blue at the top the card reads much
lighter than the background, and over the bright cyan at the bottom it reads *darker* —
which a white overlay can never do. Solving per-channel gives roughly white 55% at the top
fading to black 28% at the bottom.

The operator's decision is **match the reference**. Starting point, to be tuned in the
side-by-side pass:

```css
--card-bg: linear-gradient(180deg, rgba(255, 255, 255, 0.55), rgba(0, 0, 0, 0.28));
```

This deviation is recorded in the README written in `06`.

### Geometry

| Token | Value | Source |
|---|---|---|
| `--sidebar-width` | `340px` | 327 image px ÷ 0.96559 = 338.7 → the brief's 340 confirmed |
| `--sidebar-padding` | `12px` | Heading ink starts 11.4px in; input box 6.2px in |
| `--panel-padding` | `24px` | Heading ink 26.6px from the panel edge; card 1 edge ~21px |
| `--card-radius` | `14px` | From the brief; consistent with the reference corners |
| `--card-height` | `256px` | Measured 256.8 |
| `--card-gap` | `26px` | Measured 25.9–26.9 |
| `--input-height` | `44px` | Measured 44.5 |

Cards are `grid-template-columns: repeat(5, 1fr)` with `--card-gap`. At 1366px that yields
174.8px cards against 176px measured — within sampling error, and it is what makes the
layout hold at 1280 and 1440.

### Type

Inter via `next/font`, replacing the Geist fonts currently in `app/layout.tsx`.

| Element | Size | Weight | Measured |
|---|---|---|---|
| `Search`, `Weather`, `5-Day Forecast` | `32px` | 700 | ink 22.8–30.0 css → ~31px |
| City name | `64px` | 300 | ink 62.1 css incl. descender → 64.2px |
| Temperature | `96px` | 200 | see note |
| Card day label | `22px` | 700 | ink 20.7 css |
| Card `L` / `H` | `28px` | 400 | ink 22.8 css |
| Card temperatures | `32px` | 400 | ink 23.8 css |
| Disclaimers | `11px` / line-height `16.5px` | 400 | line pitch 16.6 css |

> **Temperature size.** The brief says "around 96px". Measured ink height is 79.7 css,
> which back-solves to roughly **105px** for a typical cap-height ratio. Build at the
> brief's `96px`, then adjust during the side-by-side and record what you landed on. Do not
> silently override the brief's figure before comparing.

### Icons

| Element | Size | Measured |
|---|---|---|
| Current-conditions icon | `~200px` | Glyph ink 189.5 × 190.6 css, horizontally centred in the panel |
| Card icon | `~56px` | Glyph ink 45.6 css tall |

Card internals, as offsets from the card's top edge: day label ink at `29px`, icon ink at
`84px`, `L`/`H` row at `163px`, temperatures at `201px`.

---

## Layout structure

Two columns, full viewport width, full viewport height.

- **Sidebar** — `--sidebar-width`, `--color-sidebar-bg`, `display: flex;
  flex-direction: column`. Contains the `Search` heading, the `Search by city` input,
  the results list under the input, and the disclaimer pinned to the bottom with
  `margin-top: auto`. Sits `24px` off the bottom edge.
- **Panel** — remaining width, the vertical gradient. Contains the `Weather` heading, the
  large centred icon, the city name, the temperature, then `5-Day Forecast` and the 5-card
  grid, then the second disclaimer.

Use CSS Modules per component. The only global stylesheet is `app/theme.css` plus a small
reset and the weather-icons import.

---

## Disclaimers

The reference has **two** blocks. The brief mentions only the sidebar one; the operator's
decision is to build both from a single `Disclaimer` component that takes the copy as a
prop. Both strings are transcribed from the reference — they do **not** need to be
requested.

**Sidebar** (`--color-text`, pinned bottom):

> The information provided by this weather application is for general informational
> purposes only. All weather data, forecasts, and alerts are obtained from third-party
> sources and are provided “as is” without warranty of any kind, either express or implied.
> While we strive to provide accurate and timely information, we make no representations or
> warranties of any kind regarding the accuracy, completeness, reliability, or suitability
> of the weather data presented.

**Panel** (below the forecast grid, two paragraphs, dark text on the cyan):

> Users are advised to consult official government sources and exercise their own judgment
> when making decisions based on weather conditions. The App and its developers are not
> liable for any direct, indirect, incidental, or consequential damages or losses arising
> from the use of or reliance on information provided by the App.

> By using this App, you agree to assume full responsibility for any decisions or actions
> taken based on its content.

Note the curly quotes around “as is” in the sidebar copy — reproduce them, and remember
`'` / `"` in JSX text need no escaping but will trip `react/no-unescaped-entities`. Use the
HTML entities or a string expression.

---

## weather-icons wiring

```css
@import 'weather-icons/css/weather-icons.min.css';
```

The package's `@font-face` uses relative `url('../font/…')` paths. If Turbopack does not
resolve them, the fallback is to copy `node_modules/weather-icons/font/` into `public/font/`
and declare the `@font-face` locally. Verify by loading the page and confirming glyphs
render rather than tofu boxes — a missing font shows as blank space, not an error.

> `weather-icons@1.3.2` provides `.woff`, `.ttf`, `.eot` and `.svg`, but **no `.woff2`**.
> That is expected; do not go hunting for one.

---

## Cypress E2E

`cypress/e2e/`. **Intercept the network — never hit the real API.** Reuse the committed
fixtures from `lib/weather/fixtures/` as intercept bodies so E2E and unit tests describe
the same world.

**Happy path:**

```
visit / → type "Chicago" → intercept /api/geocode → results appear
→ click "Chicago, …, US" → intercept /api/weather
→ city name, temperature, current icon visible
→ 5 forecast cards visible, first labelled "Today"
→ both disclaimers visible
```

**Error path:** search `asdfgh`, intercept `/api/geocode` returning `[]`, assert the
no-results message from `01` — assert the exact string that spec settled on.

E2E asserts behaviour, not pixels. Visual fidelity is checked by the comparison below.

---

## The comparison — do this before calling the spec done

The acceptance criterion is fidelity to the reference, so it is not met until the two have
actually been placed side by side. Run the app and drive a real browser:

1. `pnpm dev`, viewport **1366px** — the reference's capture width. Screenshot.
2. Compare against `docs/reference.png` region by region: sidebar width, gradient
   endpoints, icon size and centring, city/temperature scale, card grid geometry, both
   disclaimers.
3. Re-check at **1280px** and **1440px**: the sidebar stays `340px`, the grid stays 5
   columns, nothing wraps or overflows.
4. Record any value you changed from the token table above, and why.

To exercise it you need a selected city. Use the Cypress intercepts, or point the app at
the real API with the key already in `.env.local`.

---

## Done means

- [ ] `app/theme.css` holds every token; no hardcoded color, radius or spacing in any `.module.css`
- [ ] Inter loaded via `next/font`; Geist removed from `app/layout.tsx`
- [ ] Sidebar is `340px`, `#f7f7f7`, disclaimer pinned with `margin-top: auto`
- [ ] Panel gradient runs `#0168c3` → `#52d9ff` vertically
- [ ] Card background matches the reference gradient, not the flat value in the brief
- [ ] Grid renders 5 columns at 1280, 1366 and 1440
- [ ] weather-icons glyphs render — verified visually, not just by class name
- [ ] Both disclaimers present, copy exact
- [ ] Cypress happy path and no-results path pass, both fully intercepted
- [ ] `pnpm e2e` green with `pnpm dev` running
- [ ] Side-by-side comparison performed at 1280/1366/1440, deviations recorded
- [ ] `pnpm check` green
- [ ] Committed as `feat(spec-4): visual layout`

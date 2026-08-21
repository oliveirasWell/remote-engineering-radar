# Tech debt

## 1. Weather icons are not rendered

The OpenWeather condition-code to CSS-class mapping (`iconClass`) and the
`WeatherIcon` component were **removed** because they produced no visible output.

**Root cause.** The `weather-icons` package is installed, but its stylesheet is never
imported. `globals.css` only contains a reset, so `<i class="wi …">` renders an empty
glyph. The CSS wiring is a Spec 4 concern (`@import 'weather-icons/css/weather-icons.min.css'`)
and was never applied; the Spec 2 icon map was added ahead of that wiring.

**Resolution (deferred to Spec 4).**

- Wire the stylesheet (or copy `node_modules/weather-icons/font/` into `public/font/`
  and declare the `@font-face` locally if Turbopack does not resolve the relative paths).
- Re-implement the OWM-code → class map and the `WeatherIcon` component.
- Verify glyphs render visually, not just by class name.

**References.** `specs/README.md` §6 (the `wi-owm-*` classes do not exist in
`weather-icons@1.3.2`, **F1**) and `specs/02-current-weather.md` §Layer 4 (the full map
table). `CurrentWeather.iconCode` and `CurrentWeather.isDay` remain in the domain contract
for this purpose.

## 2. `CurrentWeather` deviates from Spec 2's icon coverage

Spec 2 lists icon-map tests in its "Done means". Those tests are intentionally removed
with the icon implementation; this document records the deviation until the mapping is
restored in Spec 4.

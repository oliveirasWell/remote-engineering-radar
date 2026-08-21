# Tech Debt

## 1. Weather icons are not rendered

Status: resolved in Spec 4.

The OpenWeather condition-code to CSS-class mapping (`iconClass`) and the
`WeatherIcon` component were restored after the weather-icons stylesheet was wired.

**Root cause.** The icon map was initially added before the `weather-icons` stylesheet was
imported, so `<i class="wi …">` rendered without a font glyph.

**Resolution.**

- Wire the stylesheet (or copy `node_modules/weather-icons/font/` into `public/font/`
  and declare the `@font-face` locally if Turbopack does not resolve the relative paths).
- The OWM-code → class map and `WeatherIcon` component are implemented.
- The E2E suite verifies the icon element is visible.
- A full side-by-side glyph comparison remains part of the manual visual pass.

**References.** `specs/README.md` §6 (the `wi-owm-*` classes do not exist in
`weather-icons@1.3.2`, **F1**) and `specs/02-current-weather.md` §Layer 4 (the full map
table). `CurrentWeather.iconCode` and `CurrentWeather.isDay` remain in the domain contract
for this purpose.

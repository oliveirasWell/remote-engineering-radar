# Home report rendering cache

## Amendment

The existing report cache stores the company data for an hour, but the home
route renders its large client-component payload for each uncached document
request. A production request returned about 900 KB of HTML with
`Cache-Control: no-store`; caching the data alone does not reuse the rendered
report. The report can include up to 100 companies and five job previews per
company.

Cache the rendered home report using the same lifetime as the underlying data.
Resolve and validate country and focus query parameters before entering the
render cache so arbitrary query strings cannot generate unbounded entries.
Do not cache the request's `searchParams` promise or change the existing
metadata, links, locale handling, or report refresh interval. The CDN may
still invoke the route for each dynamic document; the cache reduces the
work done by the function on a warm cache hit.

## Verification

- A production build accepts the server-component cache boundary and keeps
  the existing page and metadata routes working.
- The same validated country/focus combination reuses rendered report output;
  different valid combinations retain their own data and UI. Invalid filters
  reuse the unfiltered combination.
- After deployment, compare the same route and time window in Vercel's
  function CPU metrics. Do not infer billing-period savings from a shorter
  route-metrics window.

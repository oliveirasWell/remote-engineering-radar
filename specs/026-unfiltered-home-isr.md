# ISR for the unfiltered home

## Amendment

The home currently reads `searchParams` in both the page and metadata on every
request. Its company data and rendered RSC output have hour-long caches, but
the HTML document remains dynamic (`Cache-Control: no-store`), so even visitors
to the unfiltered home invoke the origin. A production response was about
919 KB uncompressed. The daily ingest runs without redeploying the site, so
a build-only snapshot would become outdated.

Serve the unfiltered English `/` and Portuguese `/pt-BR` documents from the
platform's ISR cache. Keep the existing one-hour data revalidation lifetime and
all current home content, metadata, locale redirects, and interaction behavior.
Filtered home views still resolve their bounded country and focus values on
the server, preserve the current query-string URLs and canonical/alternate
metadata, and may remain dynamic. Do not send the entire catalog to the
browser to implement client-side filters. A cache hit must not vary with or
expose another visitor's cookie; the existing cookie redirect is applied
before resolving the English home route. Preserve actual HTTP 404 responses
for missing jobs and blocking metadata errors on other routes.

The existing `htmlLimitedBots: /.*/` is deliberate: removing it makes an
invalid job URL return a streamed 200 for browsers and Googlebot. A narrowly
matched Proxy removes the User-Agent only from unfiltered home requests, so
Next can serve their fully prerendered HTML while all other routes keep the
existing error status behavior. This adds one lightweight Proxy invocation
before home cache hits; compare that cost with the avoided origin CPU.
Build-time prerendering also requires `DATABASE_URL` in the preview deployment;
grant it only to the review branch rather than every preview branch.

## Plan

1. Route requests with `country` or `focus` query keys to a dedicated dynamic
   filtered page using query-conditioned rewrites. Route the unfiltered paths
   to a page that never reads request `searchParams`. Keep locale redirects
   ahead of rewrites and retain the public query-string URL and metadata.
2. Reuse the current home presentation and validated report reader in both
   routes. Make the unfiltered page and metadata prerenderable for the two
   known locales, with the report and layout's ingest count refreshing on
   their existing cache lifetime. Leave the detail and filtered routes under
   the original blocking metadata behavior. Render a stable absolute job date
   in prerendered HTML and calculate relative time after hydration.
3. Write failing routing/page/date regression tests before implementation. Run
   the focused tests, the repository checks, and a production build. On a
   preview, request `/` and `/pt-BR` twice and inspect cache headers and
   content. Verify filtered URLs and locale redirects remain correct.

## Acceptance

- The production build fully prerenders the two unfiltered home documents;
  repeat preview requests to those URLs show a Vercel cache hit without
  rerendering the home page. The small Proxy invocation still runs on hits.
- Country/focus filters still produce their existing results and SEO metadata
  at their existing URLs, including invalid and combined filters.
- The time of the latest ingest and the report refresh after an ingest without
  requiring a redeploy. Relative time labels update on hydration rather than
  freezing their displayed age at build time; the HTML has an absolute date.
- Missing job URLs still respond with HTTP 404 for both normal browsers and
  crawlers. A Portuguese locale cookie still redirects `/` before the cached
  English page is served.

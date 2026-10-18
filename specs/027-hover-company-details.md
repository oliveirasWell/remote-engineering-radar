# Load company details on intent

## Amendment

The company list uses native `<details>` rows, but closed rows already contain
their hiring evidence and up to five job cards in both HTML and the RSC payload.
The unfiltered home shipped roughly 919 KB of uncompressed HTML before ISR;
about 580 KB was markup inside the 100 closed rows. ISR reduces origin work
on hits but still transfers and hydrates this unused content.

Keep the company name, kind, and open-role count visible immediately. Do not
fetch or serialize hiring evidence and job previews for every company during
the initial home render. Prefetch one company's details after a brief pointer
hover or keyboard focus, only if that company/filter combination is not
already cached or in flight. Opening a row by mouse, touch, or keyboard loads
it immediately if needed; a pending request shows localized loading feedback.
An error offers a localized retry and does not poison the client cache.
Preserve the current company and job filters, sorting, links, locale, and
five-job preview once the details arrive. Hidden jobs and click counts continue
to work. The public detail response must never include job descriptions or
private ingestion credentials.

## Plan

1. Extend the cached home reader with an overview mode that skips the signals
   and job-card reads but retains company ordering and per-company counts.
   Reuse the existing full mode for its current callers.
2. Add one public, validated, one-company read and a small GET route. Restrict
   the response to the selected company's current hiring evidence and five
   eligible jobs; cache successful responses at the CDN for an hour.
3. Keep native `<details>` and put the client request in one focused component.
   Share a bounded promise cache across repeated opens and hover requests;
   debounce pointer intent, cancel an unstarted hover on leave, and recover
   from failures. Use the same path for pointer, focus, and toggle events.
4. Write failing tests for the overview query budget, one-company isolation,
   and hover/open/retry behavior. Run the full quality gate and verify the
   initial HTML size and expanded content in a preview.

## Acceptance

- The unfiltered home still renders all 100 company summaries when available,
  but no closed company's detail body or job-card data appears in its initial
  HTML/RSC response.
- One hover/focus fetches only the intended company once; opening after a
  completed prefetch displays its details without another request. Touch or
  keyboard opening without hover also loads them. Errors can be retried.
- The server rejects malformed or absent company IDs, returns only eligible
  filtered jobs for the requested company, and does not fetch all 100 companies'
  cards on a cache miss. Repeat successful detail requests can hit the CDN.
- The company filters, job counts, localized links, SEO metadata, and real
  404 behavior outside the home remain intact.

## Implementation reconciliation

The existing cached report reader keeps its full-detail mode for existing
callers and adds an overview mode for both home routes. A separate cached
one-company reader supplies signals and up to five eligible jobs through a
public GET endpoint. The browser keeps a bounded promise cache per company,
filter combination, and ingest timestamp. Pointer intent is delayed briefly;
focus and opening use the same request, and an error can be retried.

On the same local seeded database, the unfiltered home retained 100 company
summaries while its complete HTML fell from about 618 KB to 110 KB. No closed
row contained a job article or internal job link; a fetched company returned
688 bytes of JSON. These are local uncompressed measurements, not a Vercel
transfer or CPU estimate. Local tests, build, and preview checks gate the PR.

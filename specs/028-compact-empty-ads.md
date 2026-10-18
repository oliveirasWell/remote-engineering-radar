# Compact empty ad placements

## Amendment

The header slot is configured, so the current component renders its AdSense
`<ins>` even when Google returns no creative. On the production home, Google
set `data-ad-status="unfilled"` and left an empty 280 px iframe. The home slot
is not configured, but preview deployments intentionally show a 120 px layout
placeholder. Both can look like a large white advertisement with no content.

Keep the ad visible and responsive while Google is requesting or displaying a
creative. Once the top-window unit reports `data-ad-status="unfilled"`, hide
only that empty unit and show a small black labeled bar instead. Use Google's
ad status, not `data-adsbygoogle-status="done"`, which only means the request
was processed. Do not hide units before the request completes, and do not
interfere with filled or optimized units. If a slot is unconfigured, keep it
absent in production; preview placeholders become the same compact black bar
instead of reserving 50 or 120 px of pale space. Existing localized labels
remain in the catalogs.

## Plan and verification

1. Add failing component tests for an unfilled configured unit, a filled unit,
   and compact preview placeholders while preserving the no-slot production
   case and Strict Mode single request.
2. Observe the AdSense `data-ad-status` attribute after mount, including a
   status applied before observation begins. Use Tailwind utilities to hide an
   unfilled `<ins>` despite Google's inline `display` and to style the fallback.
3. Run component tests, repository checks, and a production build. Confirm the
   preview/production behavior in a real browser after deployment.

## Implementation reconciliation

The configured unit stays mounted while AdSense runs. A `MutationObserver`
tracks `data-ad-status`, and the compiled Tailwind important utility overrides
Google's inline `display: block` only for `unfilled`. The component then shows
a 24 px black bar using its existing localized labels. Preview placeholders
use that same bar, while a missing production slot still renders nothing.
In a local production build opened with Chrome, the no-fill topbar changed
from an empty 280 px iframe to the compact dark bar after AdSense responded.

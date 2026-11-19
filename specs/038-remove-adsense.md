# Remove Google AdSense

Supersedes SPEC-028 (compact empty ads) and closes SPEC-032 (PR #91, an
"Advertise here" card built on the AdSense placement).

## Why

AdSense brought no meaningful revenue, the home slot was never configured,
and the loader script ran on every page.

## Change

- Removed the AdSense loader script from the layout, the `AdUnit` component
  (top bar and home placements), `lib/marketing/adsense.ts` and
  `public/ads.txt`.
- The privacy policy drops its Advertising section, the publisher id and the
  Google ad settings links, in both languages. Google Analytics, a separate
  service, stays and keeps its disclosure.
- Tests now assert that no AdSense script or ad slot is rendered and that the
  privacy page no longer mentions AdSense.

## Follow-up outside the repository

Remove the site from the AdSense account so it stops expecting `ads.txt`.

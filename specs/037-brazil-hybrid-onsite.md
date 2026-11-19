# Hybrid and on-site roles in Brazil

## Problem

The target Brazilian employers (iFood, PicPay, Mercado Livre, Stone, Nubank,
the banks) hire almost only hybrid or on-site. The ingest kept remote roles
only, so reading their boards added about one job each (iFood: 65 roles, 1
remote, on 2026-11-19).

## Behavior

- The ingest keeps a role when it is remote anywhere, or hybrid or on-site
  with Brazil among its resolved countries. Hybrid and on-site roles elsewhere
  are still dropped, to keep the database within the plan's size limit.
- Every existing view stays remote-only by default: the home and its
  companies to watch, company job lists, hiring signals (the ingest now feeds
  only remote cards to `detectHiringSignals`), the newsletter, the sitemap,
  the latest-ingest count and the GraphQL `jobs` default.
- `/jobs` already offers the work model select (Remote default, Hybrid,
  On-site). Under Hybrid or On-site there is no score floor: the −50 on-site
  penalty ranks remote lists, and a reader who chose on-site still sees
  those roles.
- `isKeptWorkModel` (`lib/jobs/work-model/`) is the one rule: the ingest
  stores only those roles and the job detail page opens only those, so a
  stray hybrid row outside Brazil still answers 404.
- `pnpm metrics:sources` adds the database size and active jobs per work
  model, to compare storage before and after.

## Verification

- Ingest: a hybrid role in Osasco and an on-site role in São Paulo are kept;
  a hybrid role in Berlin is not; hybrid-only companies get no hiring signal.
- Jobs page: the on-site filter lists a Brazilian on-site role with a
  negative score, the default list stays remote, and its detail page opens.

## Known debt

- The newsletter and the members area lanes stay remote-only.
- Brazil is detected from the resolved location countries; a Brazilian role
  whose board omits the country is dropped.

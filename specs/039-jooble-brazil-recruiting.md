# Jooble: Brazilian recruiting roles

## Problem

The recruiting lane (SPEC-035) had two Brazilian roles. Brazilian recruiters
are hired through boards the radar cannot read (Gupy, Remotar's terms forbid
crawling). Jooble's partner API is meant for republishing with a link back.

## Behavior

- `JOOBLE_API_KEY` (GitHub Actions secret, `production-ingestion`) enables the
  source; without it the ingest skips Jooble. The key is tied to one Jooble
  country: it must come from `br.jooble.org`.
- Searches `recrutador`, `tech recruiter`, `talent acquisition` and
  `recrutamento e seleção` in `Brasil`, two pages of 50 each, sequentially.
- `datecreatedfrom` (undocumented, verified on 2026-11-20) is two days before
  the run: Jooble ranks by relevance, and the filter keeps recent postings
  (median age 3 days instead of 8).
- Only roles on the recruiting lane are kept, so a search hit such as an
  administrative or client-"recruiter" role does not reach the radar.
- Work model: remote only when the title or location says so; a snippet perk
  ("auxílio home office") does not count. A location that names only the
  country ("Brasil") with no remote signal is skipped rather than guessed.
  Other Brazilian roles follow SPEC-037 (on-site when no model is stated).
- Each role links to its Jooble page (the partner attribution). Any request
  failure is rethrown as a fixed message, because the key is part of the URL.
- Jooble is read before Himalayas, which stays last (SPEC-036).

## Measured before building (probe, 2026-11-20)

From the first 50 results per search: `recrutador` 42 kept of 16,375,
`tech recruiter` 18 of 3,837, `talent acquisition` 17 of 30,896. Review of
130 lane titles found three false positives, fixed in #105.

## Known debt

- Careerjet needs an allow-listed fixed IP; GitHub Actions and Vercel have
  none, so it is not read.
- The lookback is fixed at two days, not the previous ingest time.

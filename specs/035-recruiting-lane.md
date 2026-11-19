# Recruiting lane

## Problem

Recruiter titles were in `unrelatedRoleTitle` (en `recruiter`,
`talent acquisition`; pt `recrutador`), so the ingest discarded every
recruiting job before it reached the database. Jobicy and GetOnBrd were also
queried for engineering categories only.

## Behavior

- New lane `recruiting` (chip "Recruiting" / "Recrutamento", slug
  `recruiting`), first in `LANE_STRATEGIES` because a recruiter's title names
  the job.
- Rules: the title matches `VOCABULARY.recruitingTitle` (en: recruiter,
  recruiting, recruitment, talent acquisition/partner/sourcer, sourcer,
  headhunter, plus the Spanish `reclutador`/`reclutamiento` and French
  `recrutement` that GetOnBrd and Himalayas return; pt: recrutador(a),
  recrutamento, aquisição/atração de talentos) and none of
  `RECRUITING_TITLE_VETOES` (engineer, developer, designer, marketing, brand),
  so "Software Engineer, Recruiting Platform" and "Product Marketing Manager -
  Recruitment Cloud" stay off.
- Recruiting terms leave `unrelatedRoleTitle`; "People Partner" stays there.
  Procurement "Sourcing Manager" and talent-pool postings ("Banco de
  Talentos") match no recruiting term.
- Sources: Jobicy also requests `industry=hr`; GetOnBrd also reads the `hr`
  category. Jobs listed in both requests are kept once. GetOnBrd's combined
  feed is complete only when every category was read to its last page, so a
  capped category never retires jobs.
- The newsletter's member API and public signup accept the new focus through
  `JOB_FOCUS_FILTER_OPTIONS`; the members area mirrors the list.

## Eval

`lib/classification/evals/recruiting-lane/` holds 63 labeled titles (36
recruiting, 27 not) collected on 2026-11-18 from the Greenhouse and Ashby seed
boards, Jobicy `hr`, GetOnBrd `hr` and Himalayas, plus synthetic Brazilian and
engineering-team cases. A title is predicted on the lane when the ingest
persists it and `roleFocus` contains `recruiting`. The suite fails below 0.95
precision or recall and lists the wrong titles; today both are 1.0. Add every
misclassified production title to `cases.ts` before changing a pattern.

## Volume check (2026-11-18)

The branch classifier placed 37 titles from one day's sample on the lane:
Jobicy `hr` 12/31, GetOnBrd `hr` 2/8, Himalayas 9/400 (of ~2,000 per run) and
the 12 seed ATS boards 14/854. Production reads every discovered board and the
full Himalayas feed before remote and geography filters.

## Known debt

- "Talent Operations Specialist" and similar titles are ambiguous and left out
  of the eval and the vocabulary.
- French titles are matched only for `recrutement`; the radar has no French
  vocabulary.

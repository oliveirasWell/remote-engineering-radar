# Remote Engineering Radar — spec suite

Eval-driven build, executed **one spec at a time**. All code, comments, test names,
commit messages, and documentation are in **English**.

Execution order: `001` → `002` → `003` → … → `014` (see project brief). Specs
numbered `015` and above were added after that run and are independent of each other,
except that SPEC-015 Part 1 now extends SPEC-016 rather than preceding it.

Completed:

- [SPEC-001](001-repository-infrastructure.md) — repository and infrastructure
- [SPEC-002](002-job-domain-model.md) — job domain model
- [SPEC-003](003-greenhouse-adapter.md) — Greenhouse adapter
- [SPEC-004](004-ashby-adapter.md) — Ashby adapter
- [SPEC-005](005-hacker-news-adapter.md) — Hacker News adapter
- [SPEC-006](006-job-relevance-classifier.md) — job relevance classifier
- [SPEC-007](007-job-scoring.md) — job scoring
- [SPEC-008](008-deduplication.md) — deduplication
- [SPEC-009](009-company-hiring-signals.md) — company hiring signals
- [SPEC-010](010-public-report.md) — public report homepage
- [SPEC-011](011-jobs-page.md) — jobs page
- [SPEC-012](012-company-page.md) — companies page
- [SPEC-013](013-automated-ingestion.md) — automated ingestion
- [SPEC-014](014-observability.md) — observability (GA4, Sentry, UptimeRobot)
- [SPEC-016](016-cloud-ops-focus.md) — Cloud & Ops as a second tracked focus

Open:

- [SPEC-015](015-technology-prominence-and-egress.md) — technology prominence (Part 1,
  extends SPEC-016's vocabulary) and egress attribution (Part 2)
- [SPEC-015](015-design-system-about-and-cache-hardening.md) — design system, About page,
  cache-key hardening
- [SPEC-017](017-remoteok-source.md) — Remote OK source (and why Tecla is not ingestible)

Open:

- [SPEC-018](018-toolchain-upgrade-node-24-typescript-7.md) — toolchain upgrade: Node 24,
  TypeScript 6 (7 blocked by typescript-eslint), Vitest 5
- [SPEC-019](019-multilingual-classification.md) — multilingual job classification,
  starting with Portuguese (two PRs; depends on PR #48)
- [SPEC-020](020-companies-payload-and-software-track.md) — lighter companies page,
  software-only React Engineering track, fewer obvious non-tech jobs

---

## Working protocol

For **each** spec, in this exact order:

1. **RED** — write the test(s). Run them. Confirm they fail on an assertion for the
   intended behavior.
2. **GREEN** — write the minimum code to pass.
3. **REFACTOR** — clean up if needed. Tests stay green.
4. **STOP.** Report evaluation results. Do not start the next spec without approval.

Do not implement later specs early. Prefer the simplest implementation that satisfies
acceptance criteria.

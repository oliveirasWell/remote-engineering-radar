# Remote Engineering Radar — spec suite

Eval-driven build, executed **one spec at a time**. All code, comments, test names,
commit messages, and documentation are in **English**.

Execution order: `001` → `002` → `003` → … → `013` (see project brief).

Completed:

- [SPEC-001](001-repository-infrastructure.md) — repository and infrastructure
- [SPEC-002](002-job-domain-model.md) — job domain model
- [SPEC-003](003-greenhouse-adapter.md) — Greenhouse adapter
- [SPEC-004](004-ashby-adapter.md) — Ashby adapter
- [SPEC-005](005-hacker-news-adapter.md) — Hacker News adapter
- [SPEC-006](006-job-relevance-classifier.md) — job relevance classifier

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

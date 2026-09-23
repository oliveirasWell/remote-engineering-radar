# SPEC-022 — Lane strategies

**Status: open.** Replaces the React Engineering chip rule in
[SPEC-020](020-companies-payload-and-software-track.md) Part B (`software` AND NOT
other tracks). Builds on [SPEC-006](006-job-relevance-classifier.md) and
[SPEC-016](016-cloud-ops-focus.md). Does not change source adapters.

## Problem

The React Engineering chip is “has `software` and is not platform / annotation /
product”. `software` is set by `engineer` / `developer` in the title or by
`\breact\b` in the text. Head of Data Engineering, Product Designer, Angular, and
the English verb “react” all land on the chip.

`classifyRoleFocus` is an if-chain. Each track’s rule lives in a different place
(vocabulary, `SOFTWARE_ROLE_FOCUS`, `focus-filter.ts`). Adding a track means
another if and another special case in the filter.

## Today

```
JobSource.fetchJobs() → NormalizedJob → classifyJob (ifs) → score → persist
                                         focusFilter: software AND NOT other
```

`JobSource` adapters ([lib/sources/types.ts](lib/sources/types.ts)) only fetch and
normalize. They must not decide a lane. Himalayas already stores Data Engineering
because the source is a dump; the classifier is what should drop it from the chip.

`enrichJob` in [lib/ingestion/run-ingestion.ts](lib/ingestion/run-ingestion.ts)
already calls `classifyJob` after every source. That call site stays.

## Decision

Classification adapters, not source adapters.

A **lane strategy** has the same registration shape as `JobSource`: a named object
in a table, one `matches` function. Sources stay dumb. Lanes stay in
`lib/classification/lanes/`.

```
JobSource.fetchJobs() → NormalizedJob → classifyJob → LANE_STRATEGIES[0..n]
                                         first match writes roleFocus
                                         focusFilter: array_contains that value
```

A future job type is a new row in the table. A future board is a new `JobSource`.
Those two extension points stay separate.

## Strategies

Factories. A lane is constants plus a factory. `excludeAny` wraps another strategy.

- **anchorPlusN** — anchor present, at least N support terms
- **titleAnchorOrBodyPlusN** — anchor in the title is enough; in the body, anchor + N
- **anyOf** — at least N terms (`titleOnly` is a flag, not a sixth factory)
- **requiredPlusOptional** — at least one required term; optional terms do not
  require or block
- **excludeAny** — title veto around another strategy

Do not add weights or percentages. A term counts at most once.

## Lanes

First match wins, in this order: Product, Annotation, Cloud & Ops, Mobile, React.
No match → All roles only.

**React Engineering** — `excludeAny(titleAnchorOrBodyPlusN)`, N = 3

- Anchor: React the library (React.js, `React applications`, `with React`). Not the
  verb. Not “work with React engineers”.
- Support: React Native, Jest, Material UI, Tailwind, TypeScript, Next.js,
  React Testing Library, Redux / React Query
- Title veto: Angular, Vue, .NET, Java, Data Engineer
- In: “Senior React Engineer”; body “React + TypeScript + Next + Jest”
- Out: Head of Data Engineering; Product Designer; React alone in the body;
  “we react quickly”; “Angular Developer” whose JD lists React

**Cloud & Ops** — `anchorPlusN`, N = 2

- Title anchor: DevOps, SRE, Platform Engineer, Cloud Engineer, Infrastructure
  Engineer, Systems Engineer, and the PT title list already in vocabulary
- Support: AWS, Kubernetes, Terraform, Docker, Azure, GCP, Ansible
- A cloud title with fewer than two tools is out. A React job that mentions
  Docker is out (no cloud title)

**Product** — `anyOf`, N = 1, title only

- Product Manager, Product Owner, Product Lead, Product Director, Head / VP of
  Product, and the PT title list
- Not Product Engineer, Designer, or Marketing

**Data Annotation** — `anyOf`, N = 1

- Title or a closed body phrase (annotator, AI trainer, data labeler, RLHF, AI
  evaluator, PT equivalents, `data annotation`, `AI training data`)
- Not a bare “annotate”

**Mobile** — `requiredPlusOptional`

- Required (one of): iOS, Android
- Optional: React Native, Flutter
- In: iOS Engineer; Android; iOS + React Native
- Out: React Native alone; Flutter alone; “Mobile Engineer” with neither iOS nor
  Android

## Code

- Add `lib/classification/lanes/` (one factory file each, `lane-strategies.ts` for
  the table, lists in `constants.ts`). Leaf files import siblings, no barrel.
- `classifyJob` keeps seniority, remote, geography, technologies, unrelated.
  Lane `roleFocus` comes only from the table. Delete `classifyRoleFocus` ifs.
- `focusFilter` is `array_contains` of that lane’s `roleFocus`, including
  `mobile`. Delete `software AND NOT`.
- `SOFTWARE_ROLE_FOCUS` must not define the React chip. Keep it only if score
  still reads it.
- `UNRELATED_STACK` matches `data engineering`, not only `data engineer`.
- iOS / Android exceptions in `UNRELATED_STACK` move into the Mobile strategy.
- `softwareTitle` matching `engineering` / `ios` / `android` must not put a job
  on the React chip.
- Chip slug `mobile` in [lib/jobs/constants.ts](lib/jobs/constants.ts) and
  `focus` copy in [lib/i18n/messages.ts](lib/i18n/messages.ts).
- Start from `main`. Do not reuse the weighted basket from the closed PR 59.

Disciplines (`frontend`, `backend`) stay if scoring still uses them. They do not
pick a chip.

## Existing rows

Run [scripts/reclassify-active-jobs.ts](scripts/reclassify-active-jobs.ts) after
the classifier lands. It rewrites `roleFocus` / score and deactivates rows
`shouldPersistClassifiedJob` rejects. No wipe.

Dead Himalayas URLs (308 → `/jobs`) are out of scope. The Himalayas adapter is
`complete: false` and does not check link liveness.

## Acceptance

RED → GREEN → REFACTOR.

- Senior React Engineer → React
- React + TypeScript + Next + Jest in the body, software title → React
- Head of Data Engineering → not React; unrelated stack
- Product Designer + “work with React engineers” → not React
- “we react quickly” → not React
- Angular in the title, React stack in the body → not React
- iOS Engineer → Mobile
- React Native Engineer with no iOS/Android → not Mobile
- Flutter-only → not Mobile
- DevOps title + AWS + Kubernetes → Cloud
- Cloud Engineer title, no two tools → not Cloud
- Senior Product Manager → Product
- AI Trainer title → Annotation
- `focusFilter({ focus: engineering })` matches `react`, not `software`
- Adding a sixth lane is one factory call plus one table row; no new branch in
  `classifyJob` or `focusFilter` beyond the slug

`pnpm test` and `pnpm check` stay green.

## Out of scope

New job boards. Scoring weight tables. Random list order. URL liveness.
Portuguese vocabulary beyond what the lanes already reuse from SPEC-019.

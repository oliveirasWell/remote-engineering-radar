# SPEC-023 — Lane rules

**Status: open.** Amends [SPEC-022](022-lane-strategies.md). The lane table, its
order, and `focusFilter` are unchanged.

## Problem

A lane is one `matches` function built by nesting factories
(`excludeAny(titleAnchorOrBodyPlusN(...))`). Adding a condition to a lane means
another wrapper, and there is no way to state "and also not this".

The Mobile lane is `anyOf(iOS, Android)` over the whole posting, so any job whose
body mentions a phone platform lands on it: a QA Engineer testing the apps, a
Product Designer drawing them, a Go backend serving them. A lane also exempts a
job from `isUnrelatedStack`, so the QA pattern there never runs for these jobs.

## Decision

A lane is a `roleFocus` and a list of rules. A rule is
`(input: LaneInput) => boolean`. `allRulesPass` calls every rule and fails when
any rule fails. First lane whose rules all pass wins, as before.

```ts
{ roleFocus: MOBILE_ROLE_FOCUS, rules: [namesMobile, mentionsPlatform, notQaOrProduct] }
```

A disjunction stays inside one rule (React's title anchor _or_ body anchor + N).
The list only expresses conjunction.

## Rules

- **anyOf** — at least N terms, optionally title only (unchanged)
- **titleAnchorOrBodyPlusN** — unchanged
- **titleMatchesNone** — the title names none of the given terms. It is the one
  generic exclusion: stack vetoes (React) and excluded positions (Mobile) both
  use it.

`anchorPlusN` becomes `anyOf(title anchors, titleOnly)` + `anyOf(support, n)`.
`excludeAny` becomes `titleMatchesNone` as its own rule. Both factories are
deleted.

## Lanes

- **Product** — `[anyOf(productTitle, titleOnly)]`
- **Annotation** — `[anyOf(annotationTitle + annotationText)]`
- **Cloud & Ops** — `[anyOf(cloudOpsTitle, titleOnly), anyOf(cloud tools, n = 2)]`
- **Mobile** — `[anyOf(mobile names, titleOnly), anyOf(iOS, Android),
titleMatchesNone(QA + product positions)]`
- **React** — `[titleMatchesNone(React vetoes), titleAnchorOrBodyPlusN(...)]`

Mobile names: Mobile, iOS, Android, React Native, Flutter. The posting must
still mention iOS or Android, as today.

## Acceptance

RED → GREEN → REFACTOR. Every SPEC-022 lane case stays green, plus:

- Mobile Engineer, body names iOS → Mobile
- Mobile Engineer, Flutter only → not Mobile
- React Native Developer, body names iOS and Android → Mobile
- QA Engineer testing iOS and Android apps → not Mobile
- Mobile QA Analyst on Android devices → not Mobile
- Product Designer for iOS and Android apps → not Mobile
- Backend engineer whose APIs serve iOS and Android clients → not Mobile
- The `024-lane-rules` data migration reclassifies active jobs once

## Debt

- `allRulesPass` returns a boolean. Returning the first failing rule would let
  `reclassify-active-jobs --audit` say why a job left a lane.
- QA and product positions are English only.

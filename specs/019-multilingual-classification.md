# SPEC-019 — Multilingual job classification, starting with Portuguese

**Status: open.** Depends on the Product track from PR #48
(`PRODUCT_ROLE_PATTERNS`, `PRODUCT_ROLE_FOCUS`). Build on top of that branch
or after it merges.

Delivered as **two PRs**. Part 1 must change no behavior except the accent
fix. Part 2 adds Portuguese.

## Problem

The classifier in `lib/classification/classify-job.ts` and
`lib/classification/constants.ts` only understands English. That costs us in
two places.

1. **Ingestion gate.** `run-ingestion.ts` persists a job only when
   `remotePolicy === 'remote'`. Greenhouse, Hacker News and YC don't give us a
   structured remote field, so we fall back to `classifyRemotePolicy`, which
   checks `/\bremote\b/i` first against the whole haystack. A posting located
   in "Remoto" never reaches the database.
2. **Classification of jobs that do get in.** Seniority, focus tracks and
   scoring miss Portuguese words. There is also an accent bug. The haystack is
   never accent-folded, so `/\bsenior\b/i` cannot match "Sênior", and
   `/\bjunior\b/i` cannot match "Júnior".

### Verified facts (measured 2026-09-21, read-only)

Production DB, active jobs:

| Titles containing                                  | Count | Misclassified              |
| -------------------------------------------------- | ----- | -------------------------- |
| "Sênior"                                           | 23    | 21 not `senior`            |
| "Júnior"                                           | 6     | 6 not `junior`             |
| "Pleno"                                            | 19    | 19 not `mid`               |
| "Desenvolvedor/Programador/Engenheiro de Software" | 37    | 25 with empty `role_focus` |

Live Greenhouse boards `quintoandar`, `stone` and `vtex` (520 postings) were
run through the current adapters and classifier in memory:

- Remote engineering jobs persisted today: **17**. With Portuguese remote
  detection on title and location only: **21** (+4). The new ones are all
  Stone postings with location `Remoto`: "Senior Software Engineer GO",
  "SITE RELIABILITY ENGINEER II", "Software Engineer GO", and "PRODUCT MANAGER SR".
- **Noise to avoid.** "auxílio home office" appears as a _benefit_ in
  **404/404** Stone descriptions ("🏠 auxílio home office (apenas para
  contratos híbridos ou re[motos])"). QuintoAndar lists "work from anywhere
  (wfa), que permite trabalhar remotamente de qualquer lugar do mundo por até
  …" as a perk on hybrid jobs. If any "remoto" or "home office" in the
  description counted as remote, Stone's field-sales jobs would be persisted.
  That would be a net loss.
- **Useful signal.** Descriptions carry explicit work-model markers:
  `#LI-Onsite (presencial)` (100+ Stone jobs), "modelo de trabalho híbrido",
  "modelo: híbrido", "Modelo de trabalho: híbrido".
- QuintoAndar Software Engineers located in "Brasil" only mention remote
  through the WFA perk. They are hybrid and must **not** become remote.

Known collision: a bare `PO` also means SAP PI/PO ("SAP Process Integration
(PI) Process Orchestration (PO)", "SAP CPI / PI/PO"). Five active jobs hit it,
so `PO` alone must never mark Product Owner.

Expected scale: with today's sources the gain is **tens of jobs**. Volume
would only come from new Portuguese-native sources, which this spec does not
cover. The main payoff here is correct seniority, tracks and scores for
Portuguese jobs (Himalayas already stores them), plus a classifier that can
accept those sources later.

## Part 1 — Fold text, split the vocabulary by language (no behavior change)

### 1a. One fold function

`normalizeCountryName` in `lib/jobs/countries.ts` already folds text inline:

```ts
value
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '');
```

Extract it to `lib/text/fold-text.ts` as `foldText` (lowercase + NFD + strip
diacritics, no trim). Use it from `normalizeCountryName` and from
`classifyJob`. Use NFD, not NFKD, so ligatures are left alone.

### 1b. Classify folded text

`classifyJob` folds the title and the haystack once and passes the folded
strings everywhere. Patterns are written without accents. The existing
`/\bs[ãa]o paulo\b/` becomes `/\bsao paulo\b/`.

**This is the only behavior change in Part 1:** "Sênior" becomes `senior` and
"Júnior" becomes `junior`. Write RED tests for exactly those two.

### 1c. Vocabulary per language

- `lib/classification/vocabulary/types.ts` exports the type
  `ClassificationVocabulary`:

  ```ts
  type Patterns = readonly RegExp[];
  type ClassificationVocabulary = {
    remote: {
      title: Patterns;
      bodyRemote: Patterns;
      bodyHybrid: Patterns;
      bodyOnsite: Patterns;
      titleHybrid: Patterns;
      titleOnsite: Patterns;
      benefitNoise: Patterns;
    };
    seniority: Record<
      'junior' | 'mid' | 'senior' | 'staff' | 'principal',
      Patterns
    >;
    roleFocus: Record<
      'frontend' | 'fullstack' | 'backend' | 'mobile',
      Patterns
    >;
    cloudOpsTitle: Patterns;
    annotationTitle: Patterns;
    annotationText: Patterns;
    productTitle: Patterns;
    unrelatedRoleTitle: Patterns;
    relocation: Patterns;
    geography: Record<'brazil' | 'latam' | 'americas' | 'worldwide', Patterns>;
  };
  ```

  In Part 1 the `remote.*` fields hold only today's English regexes, arranged
  so that the Part 1 precedence (below) reproduces today's outcome.

- `lib/classification/vocabulary/en.ts` receives **every** language-dependent
  English pattern. Some are inline in `classify-job.ts` today (seniority,
  remote, geography, frontend/fullstack/backend/mobile, relocation). Others are
  in `constants.ts` (`CLOUD_OPS_ROLE_PATTERNS`, `DATA_ANNOTATION_*`,
  `PRODUCT_ROLE_PATTERNS`, `UNRELATED_ROLE_PATTERNS`). Move the `constants.ts`
  ones too. `UNRELATED_ROLE_PATTERNS` already contains Portuguese
  (`representante comercial`, `vendedor`); move those two to `pt.ts` in Part 2.
- `lib/classification/vocabulary/index.ts` exports `VOCABULARY`, the
  per-concept concatenation of all registered languages, typed
  `ClassificationVocabulary`. In Part 1 it registers only `en`.
- These stay in `constants.ts` because they don't depend on language:
  `TECHNOLOGY_PATTERNS` and everything derived from it,
  `UNRELATED_STACK_PATTERNS`, the `*_ROLE_FOCUS` values,
  `JOB_SENIORITY_LEVELS`, and `JOB_REMOTE_POLICIES`.
- There is **no language detection**. Every posting is matched against the
  union of all languages.

Keep the order of the seniority checks exactly as it is today: junior → mid →
principal → staff → senior. The first hit wins, and the tests depend on it.

### 1d. Replay harness

`scripts/replay-classification.ts` is a dev tool that only reads. Run it with
`tsx --conditions=react-server` and `DATABASE_URL`.

- **Baseline**: before touching the classifier, add
  `--snapshot <file>`. It writes `{ sourceJobId, source, classification,
persist }` for every active DB row, plus the live feeds of the configured
  Greenhouse boards, to a JSON file under the scratchpad (never under the repo).
- **Compare**: `--compare <file>` reclassifies the same inputs and prints
  counts plus up to 10 samples for each category: newly persisted, newly
  dropped, seniority changed, role focus changed, geography changed.
- `persist` means `shouldPersistClassifiedJob(c) && remotePolicy === 'remote'`,
  the same gate as `run-ingestion.ts`. Reuse the same function; don't copy it.
- Keep the replay script out of `knip` complaints by listing it as an entry in
  `knip.json`, the same way other scripts are listed.

### Part 1 acceptance

- RED → GREEN tests: "Desenvolvedor Sênior" → `senior`; "Desenvolvedora
  Júnior" → `junior`.
- The full suite stays green without editing any existing assertion.
- `--compare` against the baseline shows **only** seniority changes for titles
  containing "sênior" or "júnior". Any other diff is a regression.
- `tsc`, eslint and prettier are clean on changed files.

## Part 2 — Portuguese vocabulary and remote-policy precedence

### 2a. Remote-policy precedence

Replace the current "first regex hit on the haystack" with this order in
`classifyRemotePolicy`:

1. The structured `input.remotePolicy` (unchanged).
2. **Title + location** (folded): remote → hybrid → onsite patterns.
3. **Description**: first remove every `benefitNoise` match from the text. Then,
   if any `bodyHybrid` or `bodyOnsite` pattern matches, return hybrid/onsite
   (hybrid is checked before onsite). Only then check `bodyRemote`.
4. Otherwise `undefined`.

English patterns:

- title remote `\bremote\b`
- body remote `\bremote\b`
- body hybrid `\bhybrid\b`
- body onsite `\bonsite\b|\bon-site\b|\bin[-\s]?office\b`
- benefit noise `home office allowance`, `work from anywhere\b[^.]{0,80}\b(days|weeks)\b`

Also add `#li-remote`, `#li-hybrid` and `#li-onsite` to the English body
patterns. They are LinkedIn tags and mean the same in every language.

**Step 3 changes English behavior.** A body that says both "remote" and
"hybrid" becomes hybrid instead of remote. Use the replay to measure how many
English jobs lose `remote`, and list them in the PR. If the samples show real
remote jobs being lost, narrow `bodyHybrid` instead of dropping the rule.

### 2b. `lib/classification/vocabulary/pt.ts` (patterns are accent-free)

| Concept             | Patterns                                                                                                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| remote.title        | `\bremot[oa]\b`, `\bhome[\s-]?office\b`, `\b100\s*%\s*remot[oa]\b`                                                                                                                                           |
| remote.titleHybrid  | `\bhibrid[oa]\b`                                                                                                                                                                                             |
| remote.titleOnsite  | `\bpresencial\b`                                                                                                                                                                                             |
| remote.bodyRemote   | `\b100\s*%\s*remot[oa]\b`, `\b(?:trabalho\|modelo\|regime)(?:\s+de\s+trabalho)?\s*:?\s*remot[oa]\b`                                                                                                          |
| remote.bodyHybrid   | `\bmodelo(?:\s+de\s+trabalho)?\s*:?\s*hibrid[oa]\b`, `\bregime\s+hibrido\b`                                                                                                                                  |
| remote.bodyOnsite   | `\bmodelo(?:\s+de\s+trabalho)?\s*:?\s*presencial\b`, `\brotina\s+presencial\b`                                                                                                                               |
| remote.benefitNoise | `\bauxilio\s+home[\s-]?office\b`, `\btrabalhar\s+remotamente\s+de\s+qualquer\s+lugar\b[^.]{0,60}\bate\b`                                                                                                     |
| seniority.junior    | `\bestagi(?:o\|ari[oa])\b`, `\bjunior\b` (already in en after the fold)                                                                                                                                      |
| seniority.mid       | `\bpleno\b`                                                                                                                                                                                                  |
| seniority.senior    | none (`senior`/`sr` already in en)                                                                                                                                                                           |
| roleFocus           | none at first; add only if the replay shows misses                                                                                                                                                           |
| cloudOpsTitle       | `\bengenheir[oa]\s+de\s+(?:plataforma\|infraestrutura\|confiabilidade)\b`                                                                                                                                    |
| annotationTitle     | `\banotador(?:a\|es)?\b`, `\btreinador(?:a)?\s+de\s+ia\b`, `\brotulador(?:a)?\b`                                                                                                                             |
| annotationText      | `\banotacao\s+de\s+dados\b`, `\brotulagem\s+de\s+dados\b`                                                                                                                                                    |
| productTitle        | `\b(?:gerente\|coordenador(?:a)?\|diretor(?:a)?\|head\|lider)\s+de\s+produtos?\b`, `\bgestao\s+de\s+produtos?\b`, `\bdono\s+do\s+produto\b`                                                                  |
| unrelatedRoleTitle  | `\brepresentante\s+comercial\b`, `\bvendedor(?:a)?\b` (moved from en), `\bconsultor(?:a)?\s+comercial\b`, `\bexecutiv[oa]\s+de\s+(?:vendas\|contas)\b`, `\brecrutador(?:a)?\b`, `\bsucesso\s+do\s+cliente\b` |
| relocation          | `\b(?:realocacao\|relocacao)\b`                                                                                                                                                                              |
| geography.latam     | `\bamerica\s+latina\b`, `\blatinoamerica\b`, `\bamerica\s+do\s+sul\b`                                                                                                                                        |

`gerente de produto` moves from `en.ts` (where PR #48 placed it) to `pt.ts`.
Never add a bare `\bpo\b`.

### 2c. Tests (`lib/classification/classify-job.test.ts`)

Put the strings in named constants at the top of the file, as the file already
does. Add a RED case for each row of the table above, plus these:

- Stone-style benefit noise: title "Consultor(a) Comercial Externo", location
  "Varginha, Minas Gerais, Brasil", body containing "auxílio home office" and
  "#LI-Onsite (presencial)" → remotePolicy `onsite`, and not persisted
  (unrelated role).
- QuintoAndar-style perk: title "Senior Software Engineer", location "Brasil",
  body containing "work from anywhere (wfa), que permite trabalhar remotamente
  de qualquer lugar do mundo por até 30 dias" and "modelo de trabalho híbrido"
  → `hybrid`.
- Stone-style remote: title "Senior Software Engineer GO", location "Remoto"
  → `remote`.
- `SAP Process Integration (PI) Process Orchestration (PO) Integration Engineer`
  does not get the product role focus.
- "Desenvolvedor Pleno React" → `mid`.

### Part 2 acceptance

- Suite, `tsc`, eslint and prettier are green.
- The replay compare against the Part 1 snapshot, recorded in the PR description:
  - DB rows: the 19 "Pleno" titles become `mid`; list the counts of role
    focus and geography changes, with samples.
  - Live Greenhouse boards: newly persisted ≥ the 4 Stone jobs above, and none
    of the newly persisted samples is a field-sales or hybrid job.
  - Every English job that loses `remote` is listed, with a judgment on each.

## Out of scope

- Spanish (`es.ts`). Adding it later is one file plus one line in
  `vocabulary/index.ts`, but GetOnBrd already sends a structured remote flag.
- New Portuguese-native sources (for example, other Brazilian Greenhouse boards
  or Gupy-hosted company portals). Evaluate them later with the replay
  harness. That is where job volume would come from.
- Translating UI copy. Already handled by i18n.

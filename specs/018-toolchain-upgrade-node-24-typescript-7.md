# SPEC-018 — Toolchain upgrade: Node 24, TypeScript 7, Vitest 5

## Goal

Bring the toolchain to its current major versions and refresh the key-feature dependencies,
without loosening the exact-pin discipline this repo already keeps. Every version below was
read from the npm registry on 2026-09-16 and every typecheck result was measured by running
the compiler, not estimated.

This repo is in good shape: all 41 dependencies are exact-pinned, `.npmrc` sets
`save-exact=true`, and it is already on Next 16 and Vitest 4. The lag is Node, TypeScript,
and Vitest, plus accumulated patch-level drift on the key features.

Follow the repo protocol: **RED → GREEN → REFACTOR → STOP**, one part at a time. Each part
below is a stopping point — report results and wait before starting the next.

## Part 1 — Node 22 → 24 (blocking, do this first)

This is the only part that can hard-fail the install, so nothing else can be validated until
it lands. `.npmrc` sets `engine-strict=true` and `package.json` declares:

```json
"engines": { "node": ">=22.12 <23", "pnpm": "11.22.0" }
```

**As shipped:** under pnpm 11 the `.npmrc` settings were inert — pnpm reads them from
`pnpm-workspace.yaml` — so the ceiling only warned. Both `engine-strict` and `save-exact`
moved there as `engineStrict` and `saveExact`, and `.npmrc` was deleted. Only then did the
ceiling actually fail the install.

The `<23` ceiling means `pnpm install` **refuses to run at all** under Node 24, rather than
warning. It also means Part 3 is blocked: `jsdom@30` requires
`^22.22.2 || ^24.15.0 || >=26.0.0`, and Vitest 5 requires `^22.12.0 || ^24.0.0 || >=26.0.0`.

Node 24.21.0 is the current LTS (Krypton). Four declarations must move together, or CI and
local development disagree:

| Location                        | From                             | To                 |
| ------------------------------- | -------------------------------- | ------------------ |
| `.nvmrc`                        | `22`                             | `24.21.0`          |
| `package.json` → `engines.node` | `">=22.12 <23"`                  | `">=24.19 <25"`    |
| `README.md`                     | "Requires Node.js 22.12+ (22.x)" | Node 24.21+ (24.x) |
| `CLAUDE.md` line 55             | "Use Node 22 and pnpm 11.22.0"   | Node 24            |

**As shipped:** `engines.node` is `>=24.19` rather than `>=24.21`, because Vercel ignores
`.nvmrc` and supplies v24.19.0 for `24.x`. `.nvmrc` pins `24.21.0` as the development and CI
version; `engines.node` is the deployment compatibility floor.

Both workflows read `node-version-file: .nvmrc`, so `.github/workflows/ci.yml` and
`.github/workflows/ingest.yml` need no edit. `ingest.yml` runs a daily production cron
against a live database — verify it green before considering this part done, not just `ci.yml`.

## Part 2 — TypeScript 5.9.3 → 7.0.2

**As shipped: TypeScript 6.0.3.** TypeScript 7 stays blocked because typescript-eslint caps
its peer range at `>=4.8.4 <6.1.0`. Moving to 7 is deferred until that range widens.

TypeScript 7 is the native port of the compiler. **Measured result: this repo compiles clean
under it.** `tsc --noEmit` was run against `tsconfig.json` with both versions:

| Compiler                     | Result   |
| ---------------------------- | -------- |
| `typescript@5.9.3` (current) | 0 errors |
| `typescript@7.0.2`           | 0 errors |

So the RED step here is not a failing test but the dry run above — reproduce it before
changing the pin, then bump `typescript` to `7.0.2` and confirm `pnpm typecheck` stays green.

Two things to check rather than assume, because they are editor- and config-level rather
than compile-level:

- `tsconfig.json` sets `"plugins": [{ "name": "next" }]`. That is a language-service plugin,
  used by editors and not by `tsc --noEmit`, so it cannot affect the result above — but
  confirm editor integration still resolves it under the native compiler.
- `"target": "ES2017"` is dated for a repo that now runs Node 24 and ships through Next 16.
  Raising it is a legitimate follow-up but is **not** part of this spec: it changes emitted
  downlevelling across the whole app and deserves its own RED-GREEN cycle.

## Part 3 — Vitest 4.1.11 → 5.0.1

The repo has 56 test files, `globals: true`, and `setupFiles: ['./test/setup.ts']`, so the
v5 behavioral changes have a wide surface here.

| Change                                                | What to check against this repo                                                                                                   |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Mocks are cleared by default before each test         | Any spy or mock configured in one block and read in another. This is the change most likely to produce silent, confusing failures |
| Un-awaited async assertions now fail                  | Latent missing `await`s become red. Treat these as bugs found, not as upgrade breakage to suppress                                |
| Config lookup no longer searches ancestor directories | `vitest.config.mts` is at the repo root, so this is expected to be a no-op — confirm it                                           |
| Reporter output paths moved under `.vitest/`          | JSON, JUnit, HTML and blob outputs default to `.vitest/`. Check `.gitignore` and any CI artifact path                             |
| `sequential` removed; `-t` separator is now `>`       | No current usage expected; confirm no script relies on the old form                                                               |

**Coupled dependency, not optional.** Vitest 5 requires `vite ^6.4 || ^7 || ^8`, and
`@vitejs/plugin-react` is pinned at `4.7.0`. Its current release, `6.1.1`, declares
`vite ^8.0.0` as a peer. `@vitejs/plugin-react` and `vite-tsconfig-paths` (`5.1.4` → `6.1.1`)
must therefore be resolved in the same step as Vitest, against whichever Vite version Vitest
5 pulls in — bumping Vitest alone will leave a broken peer graph.

Also in this part, because it is gated on Node 24 from Part 1: `jsdom` `26.1.0` → `30.0.1`
(four majors; jsdom is what the `// @vitest-environment jsdom` component tests run on).

## Part 4 — Key-feature dependency refresh

Patch and minor drift on the shipped product, once the toolchain above is green.

| Package                             | Current          | Target                             |
| ----------------------------------- | ---------------- | ---------------------------------- |
| `next`                              | 16.3.3           | 16.3.5                             |
| `eslint-config-next`                | 16.3.3           | 16.3.5                             |
| `react`, `react-dom`                | 19.2.8           | 19.3.0                             |
| `@types/react` / `@types/react-dom` | 19.2.18 / 19.2.4 | matching 19.3 line                 |
| `@types/node`                       | 22.18.11         | 24.x, matching the Node 24 runtime |
| `@sentry/nextjs`, `@sentry/node`    | 10.72.0          | 10.74.0                            |
| `knip`                              | 6.32.2           | 6.35.1                             |
| `@testing-library/react`            | 16.3.2           | 16.3.3                             |
| `lint-staged`                       | 17.3.0           | 17.5.1                             |

Already current, leave alone: `tailwindcss` and `@tailwindcss/postcss` 4.3.3, `prettier`
3.9.6, `madge` 8.0.0, `@testing-library/jest-dom` 6.10.0, `babel-plugin-react-compiler` 1.0.0.

**Do not upgrade Prisma.** The `prisma` / `@prisma/client` / `@prisma/adapter-pg` trio is
pinned at `7.10.0`, which is the current stable. The registry's `latest` tag currently points
at `8.0.0-rc.15`, a release candidate — `7.10.0` is published as `prev`. A naive
"upgrade to latest" would put a release candidate in front of the production ingestion
database. Prisma 8 is its own spec, after it ships stable, and must be planned alongside
`prisma/baseline-schema.prisma` and the `migrate-deploy` flow.

**Deferred to its own spec:** `eslint` `9.39.5` → `10.10.0` is a major.
`eslint-config-next@16.3.5` peers `eslint >=9.0.0` so it does not block, and the repo is
already on flat config, but an ESLint major reshapes rule behavior across 56 test files plus
`--max-warnings=0`. It does not belong in a toolchain upgrade.

## Constraints

- Every version stays an **exact pin**. No `^`, `~`, or `>=` enters `package.json` — this is
  the rule in `CLAUDE.md` and it is enforced by `saveExact: true` in `pnpm-workspace.yaml`.
- `pnpm-lock.yaml` is committed with each part.
- The `overrides` block in `pnpm-workspace.yaml` (`deepmerge-ts`, `js-yaml`, `mysql2`,
  `sharp`) exists to hold transitive dependencies at patched versions. Re-check each one
  still applies after the upgrades, and re-run `pnpm audit --prod`.
- GitHub Actions are pinned by commit SHA with a version comment. If any action is bumped,
  the SHA and its comment move together.

## Acceptance

1. `pnpm install --frozen-lockfile` succeeds under Node 24 with `engineStrict: true`.
2. `pnpm quality` passes — that is `format:check`, `lint --max-warnings=0`, `typecheck`,
   `test`, `db:validate`, then `build`, `deadcode`, `circular`, and `boundaries`.
3. All 56 test files pass, with none skipped, marked `todo`, or deleted to get there.
4. `pnpm db:smoke` passes, proving migrations still apply against a disposable Postgres.
5. `pnpm audit --prod` is clean.
6. Both workflows are green, including `ingest.yml` against the production environment —
   not only `ci.yml`.
7. `.nvmrc`, `engines.node`, `README.md`, and `CLAUDE.md` all state the same Node version.
8. `git diff` on every `package.json` shows exact versions only.
9. Prisma remains at `7.10.0`, and ESLint remains at `9.39.5`.

## Eval commands

```bash
nvm install 24 && nvm use
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm quality
pnpm db:smoke
pnpm audit --prod
```

## Out of scope

- Prisma 8 and ESLint 10, per the reasoning above — each gets its own spec.
- Raising `tsconfig.json`'s `target` from `ES2017`.
- Any product behavior: sources, classification, scoring, and the report pages are untouched.
  This spec changes only versions and the four Node declarations.

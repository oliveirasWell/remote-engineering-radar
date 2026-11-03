# SPEC-029 — design-system package

## Goal

Share the radar's tokens and primitives with other applications (first consumer:
the private members area) without copying files. The radar stays the source of
truth and consumes the package through the pnpm workspace.

## Package

`packages/design-system`, published to npm as the public package
`@oliveiraswell/ds` (fork PRs install it from the workspace, so they need no npm
token).

- `@oliveiraswell/ds/theme.css` — the former `app/theme.css`, unchanged: light
  tokens on `:root`, dark tokens for `prefers-color-scheme: dark` and
  `[data-theme='dark']`, and the `@theme inline` mapping. `font-sans` reads
  `--font-inter`, so consumers load Inter through `next/font` under that name.
- `@oliveiraswell/ds` — `cn` and `PageTitle` (former `components/ui/`), as ESM
  with type declarations built by `tsc -p tsconfig.build.json` into `dist/`.
- `react >=19` and `tailwindcss >=4.1` (`text-shadow-*` needs 4.1) are peer
  dependencies; `clsx`, `tailwind-merge` and `class-variance-authority` are
  exact dependencies and left the radar's own `package.json`.
- `prepare` builds `dist/`, so a fresh `pnpm install` (CI, Vercel) and
  `npm publish` both produce it. `dist/` is not versioned.

`SiteHeader`, `SiteFooter` and `SiteWordmark` stay in the app: they carry radar
copy and routes.

## Radar wiring

- `pnpm-workspace.yaml` lists `packages/*`; the root depends on
  `@oliveiraswell/ds` as `workspace:0.1.0`.
- `app/globals.css` imports `@oliveiraswell/ds/theme.css` and declares
  `@source '../packages/design-system/src'` (Tailwind 4 does not scan
  `node_modules`), excluding the package's tests so test-only classes never
  reach the stylesheet.
- `knip` has a workspace entry for the package; `tsconfig`, ESLint, Prettier and
  `madge` ignore `packages/*/dist`; Vitest also runs `packages/*/src/**/*.test.*`.

## Verification

- `PageTitle` tests: default `h2`, requested level, caller class overriding the
  default size through `tailwind-merge`, and the `panel` shadow variant.
- The production CSS bundle built from this branch is byte-identical to the one
  built from `origin/main` (`d403696`); markup is unchanged, so `/`, `/jobs` and
  `/about` render the same in light and dark.
- `npm pack --dry-run` ships only `dist/`, `theme.css`, `README.md` and
  `package.json`.

## Publishing

Manual, by the owner: `cd packages/design-system && npm publish` (the
`publishConfig` makes the scoped package public). Consumers pin the exact
version.

## Known debt

- Editing the package in the workspace needs `pnpm --filter @oliveiraswell/ds build`
  (or a reinstall) before the radar sees the change in `dist/`; the radar's
  Tailwind scan reads `src/`, so only types and runtime lag.
- No license is declared; choose one before external reuse.
- Releases are manual; add a tagged publish workflow (with npm provenance) once
  a second release is needed.

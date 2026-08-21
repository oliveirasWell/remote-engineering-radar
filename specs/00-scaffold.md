# Spec 0 — Scaffold

**Config only. No logic, no components, no domain code.** Nothing in this spec has a
red-green cycle, because there is nothing to assert yet. The gate is: `pnpm check` runs
and reports "no tests found" without erroring, and `pnpm dev` boots.

Commit: `chore: project scaffold`.

---

## 0.1 Git

The repo is not under version control and has no ignore file (**F9**). Nothing else in
this suite can satisfy "one commit per spec" until this is done.

```bash
git init -b main
```

`.gitignore`:

```
node_modules/
.next/
out/
build/
coverage/
.env
.env.*
!.env.example
cypress/videos/
cypress/screenshots/
cypress/downloads/
next-env.d.ts
*.tsbuildinfo
.DS_Store
```

> `.env.*` is ignored **before** `.env.local` is written in 0.2. Verify with
> `git check-ignore .env.local` — it must print the path. If it does not, stop; you are
> one `git add .` away from committing the API key.

## 0.2 Environment

`OPENWEATHER_API_KEY` is exported from the operator's `~/.zshrc`. Copy it into
`.env.local` without echoing it:

```bash
zsh -ic 'printf "OPENWEATHER_API_KEY=%s\n" "$OPENWEATHER_API_KEY"' > .env.local
```

Then verify without printing the value:

```bash
grep -c '^OPENWEATHER_API_KEY=.\{32\}$' .env.local   # must print 1
git check-ignore .env.local                          # must print .env.local
```

`.env.example` (committed):

```
OPENWEATHER_API_KEY=
```

**No `NEXT_PUBLIC_` prefix anywhere.** The key is read only in
`lib/weather/openweather.ts`, which is server-only.

## 0.3 Dependencies

Do not change the versions already in `package.json` — Next 16.3.1, React 19.2.8,
pnpm 11.22.0 are fixed.

```bash
pnpm add @tanstack/react-query zod server-only weather-icons@1.3.2

pnpm add -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/dom @testing-library/jest-dom \
  @testing-library/user-event vite-tsconfig-paths \
  cypress eslint-plugin-import eslint-import-resolver-typescript \
  husky lint-staged knip madge
```

Notes:

- `weather-icons` is pinned to `1.3.2` deliberately — it is the only published version
  (**F1**). Read `specs/README.md` §6 before touching icons.
- `@testing-library/dom` is a required peer of `@testing-library/react` and is not
  installed transitively under pnpm.
- `eslint-plugin-import` and `eslint-import-resolver-typescript` exist in the store as
  transitive deps of `eslint-config-next` but are **not** resolvable from the project root
  (**F3**). They must be direct devDeps.

## 0.4 Vitest

`test/server-only-stub.ts`:

```ts
// server-only@0.0.1 resolves to a module whose body is a bare `throw` outside the
// react-server condition (F2). Aliased to this stub so adapter tests fail on their
// assertions rather than on import.
export {};
```

`test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

`vitest.config.mts`:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['{app,components,lib}/**/*.test.{ts,tsx}'],
    alias: {
      'server-only': fileURLToPath(
        new URL('./test/server-only-stub.ts', import.meta.url),
      ),
    },
  },
});
```

Two things this config is doing on purpose:

- **`environment: 'node'` is the default.** Vitest 4 removed `environmentMatchGlobs`
  (**F6**). Component test files opt into a DOM by starting with a docblock:

  ```ts
  // @vitest-environment jsdom
  ```

  Cheaper than a `projects` config, and it keeps route-handler tests in a real Node
  environment where `Request`/`Response` behave correctly.

- **`globals: true`** is required for React Testing Library's automatic `cleanup` between
  tests. Without it, component tests leak DOM into each other and fail in confusing ways.

## 0.5 ESLint — the boundary rule

This rule is an explicit deliverable, not a nicety. It encodes `specs/README.md` §3.

`eslint.config.mjs` — extend the existing file, keep the `nextVitals`/`nextTs` spreads and
the `globalIgnores` block already there:

```js
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import importPlugin from 'eslint-plugin-import';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { import: importPlugin },
    settings: {
      'import/resolver': { typescript: { project: './tsconfig.json' } },
    },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './components',
              from: './lib/weather',
              except: ['./types.ts'],
              message:
                'components/ may import lib/weather/types only. The adapter, schemas and aggregate are server-side detail.',
            },
            {
              target: './lib/weather',
              from: './components',
              message: 'lib/weather/ must not depend on the UI layer.',
            },
            {
              target: './lib/weather',
              from: './app',
              message: 'lib/weather/ must not depend on the app layer.',
            },
            {
              target: './components/ui',
              from: './components/weather',
              message:
                'components/ui/ takes primitive props and knows nothing about the weather domain.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['lib/weather/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['react', 'react/*', 'react-dom', 'react-dom/*'], message: 'lib/weather/ is framework-free.' },
            { group: ['next', 'next/*'], message: 'lib/weather/ is framework-free.' },
            { group: ['@/components/*', '@/app/*'], message: 'lib/weather/ must not depend on UI or app layers.' },
          ],
        },
      ],
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'coverage/**']),
]);

export default eslintConfig;
```

`except` paths are relative to `from`, so `'./types.ts'` means `lib/weather/types.ts`.

> `next lint` was removed in Next 16 and the `lint` script is already plain `eslint`.
> Note also that **`next build` no longer runs linting**
> (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md:1084`), which is
> why `pnpm check` runs `lint` as its own step rather than relying on the build.

**Prove the rule works before moving on.** A rule that is configured but inert is worse
than no rule. Temporarily add `import { toCityMatch } from '@/lib/weather/openweather';`
to any file under `components/`, run `pnpm lint`, confirm it errors with the zone message,
then delete the import. Do the same for a `components/ui/` → `components/weather/` import.

## 0.6 TypeScript

Keep the existing `tsconfig.json`. Two changes:

- Add `"cypress"` to `exclude`. Cypress and Vitest both declare a global `expect`; leaving
  Cypress specs in the root program makes `tsc --noEmit` fail with type conflicts.
- Add `cypress/tsconfig.json` scoping Cypress to its own program:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": { "types": ["cypress"], "noEmit": true },
  "include": ["**/*.ts"]
}
```

## 0.7 Cypress

`cypress.config.ts`:

```ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
  },
});
```

Create `cypress/support/e2e.ts` as an empty file for now. **No specs yet** — E2E arrives in
`04`. Do not scaffold placeholder tests; an empty or skipped test violates the protocol.

## 0.8 Scripts

In `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "cypress run",
    "check": "pnpm lint && pnpm typecheck && pnpm test"
  }
}
```

`check` runs lint → typecheck → test in sequence, as required by Spec 5. `&&` gives the
sequencing and the fail-fast.

## 0.9 Hooks, knip, madge

```bash
pnpm exec husky init
```

`.husky/pre-commit`:

```sh
pnpm exec lint-staged
```

`package.json`:

```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "bash -c 'tsc --noEmit'"],
    "*.{css,md,json}": []
  }
}
```

`knip.json`:

```json
{
  "$schema": "https://unpkg.com/knip@6/schema.json",
  "entry": ["app/**/{page,layout,route,providers}.{ts,tsx}", "cypress/e2e/**/*.cy.ts"],
  "project": ["{app,components,lib}/**/*.{ts,tsx}"],
  "ignoreDependencies": ["weather-icons"]
}
```

`weather-icons` is ignored because it is consumed from CSS via `@import`, which knip does
not trace — it would otherwise be reported as unused on every run.

`.madgerc`:

```json
{
  "detectiveOptions": { "ts": { "skipTypeImports": true } },
  "tsConfig": "tsconfig.json"
}
```

Both tools may report nothing. That is the expected outcome, not a reason to keep tuning
them.

## 0.10 CI

`.github/workflows/ci.yml`:

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm check
      - name: Boundary greps
        run: |
          ! grep -rE "temp_min|dt_txt|weather\[0\]" components/
          ! grep -rn "NEXT_PUBLIC_OPENWEATHER" . --exclude-dir=node_modules --exclude-dir=.next
```

CI does **not** need `OPENWEATHER_API_KEY`: every test runs against committed fixtures.
If a test ever needs the live API, that test is wrong.

## 0.11 Housekeeping

- Move the reference design out of the repo root: `mkdir -p docs && git mv`-equivalent for
  `2026-08-21_01-42.png` → `docs/reference.png`. Spec `04` refers to it by that path.
- Delete `public/next.svg`, `public/vercel.svg`, `public/file.svg`, `public/window.svg`,
  `public/globe.svg`.
- Leave `app/page.tsx`, `app/page.module.css`, `app/globals.css` alone for now — they are
  replaced in `01` and `04`. Deleting them here breaks `pnpm dev` and gives you nothing.
- `AGENTS.md` is regenerated by `next dev`. Commit it if it appears dirty; removing it from
  a diff only recreates the change.

## Done means

- [ ] `git init` done, `git check-ignore .env.local` prints the path
- [ ] `.env.local` has a 32-char key; `grep -r "NEXT_PUBLIC" .` returns no key
- [ ] `pnpm lint` passes on the untouched scaffold
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` exits 0 reporting no test files
- [ ] The boundary rule was **demonstrated** to fire and then reverted (0.5)
- [ ] `pnpm dev` boots and serves the default page
- [ ] `docs/reference.png` exists
- [ ] Committed as `chore: project scaffold`

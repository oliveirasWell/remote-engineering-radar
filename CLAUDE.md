@AGENTS.md

Use const arrow functions instead of function declarations. Prefer named exports unless a framework requires a default export; in that case, define a named const and export it only as default.

All source code, tests, comments, commit messages, and documentation must be written in English.

Use a RED-GREEN-REFACTOR workflow for behavioral changes. RED must fail on an assertion for the intended behavior, GREEN must be the minimum implementation, and REFACTOR must keep the suite green.

Destructure consumed component props. Prefix a parameter with an underscore only when it is intentionally unused.

Keep page components focused on composition. Move related state and query orchestration into a dedicated hook when they form one workflow.

## Modules and folders

Prefer one primary export per implementation file. Create an `index.ts` barrel only when a folder exposes multiple public symbols; remove single-symbol `index.ts` files and import the implementation file directly. Leaf modules import sibling files directly, never their own barrel.

Place components, hooks, and standalone utilities that have direct tests in a dedicated folder containing the implementation and its test. Keep route and library tests in their owning architectural layer.

Group a module's related static values (paths, messages, cache durations, lookups) into a single `constants.ts`. A file whose exports are only types or interfaces must be named `types.ts`. A value and its derived type may coexist in a `constants.ts` file.

## Strings

Keep duplicated UI copy in a `constants.ts` next to the component and import it from both the component and its test. Single-use strings may stay inline. Do not create `.copy`, `.text`, or similar suffix files.

In tests, executable domain or API string literals (names, queries, URLs, messages, status codes) must come from fixtures, factories, contracts, or named constants. Framework and test-API vocabulary — Testing Library roles, HTML attributes, global names like `fetch`, and CSS selectors — may be written inline, as may import paths and `describe`/`it` titles.

## Behavior and boundaries

Extract repeated API paths, error messages, normalization rules, cache durations, and timeouts into named constants. Time-based constant names must include their unit, such as `_MS` or `_SECONDS`.

Keep interaction eligibility rules, such as minimum search length and debounce behavior, in the client workflow that owns the interaction. Do not duplicate those guards in route handlers unless they protect security, data integrity, or an independent external contract. Routes normalize transport input and delegate.

Do not test library configuration or trivial forwarding. Assert observable behavior, user-visible output, boundaries, or external contracts. Reuse test factories and setup helpers instead of duplicating fixtures, Query Clients, or responses.

Classify support modules by behavior: mocks replace dependencies, factories create data or instances, fixtures are static data, builders deterministically assemble values, and render helpers mount UI. Place reusable `create*` modules under `factories` and `build*` modules under `builders`. Fixtures must be self-contained and carry all of an object's data without spreading another fixture.

## Temperature

The domain stores temperatures in canonical Celsius. The provider adapter always fetches `units=metric`. Unit selection is presentation-only: a client-side toggle defaults to Fahrenheit (matching the reference) and converts Celsius to the selected unit at render via `Intl.NumberFormat`.

## Misc

Prefer explicit response-contract assertions over generic helpers that scan JSON responses for secrets. Test the response status and exact public shape at the route boundary.

Prefer immutable lookup tables and array operations over repetitive conditional chains when the behavior is data-driven.

Keep global CSS limited to genuine reset and document-level styles. Delete unused scaffold styles and colocate feature styling with its component.

Do not version machine-local configuration such as `.claude/settings.local.json` or `.serena/`. Keep one runtime-version source of truth and make CI consume it.

Do not prefix application files or folders with underscores to imply privacy. Use descriptive module names. Uppercase constants may use underscores to separate words and explicit unit suffixes.

Component tests that require browser APIs must use the `// @vitest-environment jsdom` docblock. Route handlers, schemas, and adapters must keep Vitest's Node environment.

Use Node 22 and pnpm 11.22.0. Dependency versions in `package.json` must be exact and must not use `^` or `~` ranges.

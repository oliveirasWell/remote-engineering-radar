# Spec 5 — Build and quality gate

Not an acceptance criterion, but the assessment asks for production quality and a clear
build process. Most of this was configured in `00-scaffold`; this spec is where it is
**proved to work** on a full codebase rather than an empty one.

Commit: `feat(spec-5): quality gate`.

---

## 5.1 `pnpm check`

```
pnpm check  ==  pnpm lint && pnpm typecheck && pnpm test
```

Must pass end to end. Fix causes, not symptoms — do not silence a rule to get green.

## 5.2 `tsc --noEmit` clean

Zero errors, `strict` already on.

If Cypress specs collide with Vitest globals (both declare `expect`), the fix is the
`cypress/tsconfig.json` and root `exclude` from `00-scaffold` §0.6, not `@ts-ignore` and
not loosening `strict`.

## 5.3 ESLint — zero warnings

Zero **errors and warnings**. Run `pnpm lint` with no `--quiet`.

The boundary rule is the deliverable here. Re-prove it now that there is real code to
violate — the demonstration in `00-scaffold` ran against an empty tree:

```bash
# each of these must fail lint, then be reverted
echo "import '@/lib/weather/openweather';" >> components/weather/CurrentWeather.tsx
echo "import '@/components/weather/ForecastCard';" >> components/ui/Card.tsx
echo "import 'react';" >> lib/weather/aggregate.ts
```

Confirm each produces the zone message, then `git checkout` the files.

## 5.4 The grep gates

From the brief's definition of done. These run in CI (`00-scaffold` §0.10) and must pass
locally:

```bash
grep -r "NEXT_PUBLIC" . --exclude-dir=node_modules --exclude-dir=.next   # no key
grep -rE "temp_min|dt_txt|weather\[0\]" components/                       # nothing
```

The second is the real test of the adapter's purpose: if a raw OpenWeather field name
appears anywhere under `components/`, the abstraction leaked and one of Specs 1–3 was
implemented wrong. Fix the leak; do not narrow the grep.

## 5.5 Hooks

husky + lint-staged on pre-commit, already installed. Prove it fires: stage a file with a
lint error, attempt a commit, confirm it is blocked.

## 5.6 knip and madge

```bash
pnpm exec knip
pnpm exec madge --circular --extensions ts,tsx .
```

**Both may report nothing. That is the expected outcome**, not a signal to keep tuning
config until they find something.

If knip reports genuinely unused exports — likely candidates are provider-interface
methods or `ui/` components built ahead of use — either use them or delete them. Do not
add them to `ignore` to quiet the tool; that defeats the point of running it.

`madge --circular` must be empty. A cycle between `lib/weather` modules usually means
`aggregate.ts` and `openweather.ts` are importing each other's types instead of both
importing `types.ts`.

## 5.7 CI

`.github/workflows/ci.yml` runs `pnpm check` plus the grep gates on push and PR.

CI needs **no** `OPENWEATHER_API_KEY` — every test runs against committed fixtures. If CI
fails for a missing key, a test is hitting the network and is wrong.

Confirm the workflow parses (`gh workflow view`, or push a branch and watch the run). A
workflow file that has never executed is not a quality gate.

## 5.8 `pnpm build`

```bash
pnpm build
```

Must succeed. This is the first time the code is compiled for production rather than
type-checked, and it is where server/client boundary mistakes surface — a Client Component
importing `lib/weather/openweather.ts` fails here even if `tsc` was happy, because of
`import 'server-only'`.

## 5.9 Prove the cache

The brief specifies asymmetric TTLs (geocode 30 days, weather 600s). Verified in the
bundled docs (**F4**): `cacheComponents` is off, so the previous caching model applies and
a positive `next.revalidate` does opt the fetch into the Data Cache. Confirm it empirically
rather than trusting the config:

1. `pnpm dev`.
2. Add a temporary `console.log` in the adapter immediately before `fetch`.
3. Request `/api/geocode?q=chicago` **twice**.
4. Exactly one upstream call should be logged.
5. Remove the log.

If both requests hit upstream, check that no `cache: 'no-store'` is also set — the docs
note conflicting options are both ignored. Note that in dev a request carrying
`cache-control: no-cache` bypasses `next.revalidate` entirely, so use `curl`, not a browser
hard-refresh.

Record the result in the README written in `06`.

---

## Done means

- [ ] `pnpm check` passes
- [ ] `pnpm build` passes
- [ ] `tsc --noEmit` clean
- [ ] `pnpm lint` reports zero errors **and** zero warnings
- [ ] Boundary rule re-proved against real code, all three violations reverted
- [ ] Both grep gates pass
- [ ] Pre-commit hook demonstrably blocks a bad commit
- [ ] knip and madge run; `--circular` empty; nothing silenced to get quiet
- [ ] CI workflow has actually executed and passed
- [ ] Cache behaviour observed (one upstream call for two identical requests)
- [ ] Committed as `feat(spec-5): quality gate`

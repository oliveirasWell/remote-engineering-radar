# SPEC-031 — link to the members area

## Goal

Let readers reach the private members area (a separate application and Vercel
project) from the radar's header.

## Behavior

- `NEXT_PUBLIC_AREA_URL` (in `.env.example`) holds the area's production origin.
- When it is set, `SiteHeader` renders a plain `<a href={NEXT_PUBLIC_AREA_URL}>`
  inside the main navigation, after the section links, with the same style as an
  inactive tab. It is a plain anchor rather than `next/link` because the target
  is another application.
- When it is unset or empty, no link renders.
- Copy: `navigation.area` — en `Sign in`, pt-BR `Entrar`.

## Verification

`components/site/SiteHeader/SiteHeader.test.tsx`: the link is the last one in the
navigation and points at the configured URL when set, and is absent when unset.

## Known debt

- `NEXT_PUBLIC_*` values are inlined at build time: changing the area URL needs a
  new radar deployment.
- The label says "Sign in" even for a signed-in reader; the radar has no session
  and cannot tell.

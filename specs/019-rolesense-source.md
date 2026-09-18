# SPEC-019 — Why not RoleSense

## Goal

Record that [RoleSense](https://role-sense.com/) is not an ingestible job source, so the
question is not re-opened. No adapter ships.

`https://role-sense.com/` was the original request ("adicionar RoleSense, rola?"). It is
the same class of product as Tecla in [SPEC-017](017-remoteok-source.md): a gated matching
app, not a public listings feed.

## RoleSense — blocked, do not build

Probed live on 2026-09-18. Every candidate URL used a browser Chrome UA, a Googlebot UA,
and `Accept: application/json`. Results were identical.

| Probe                                         | Result                                                                 |
| --------------------------------------------- | ---------------------------------------------------------------------- |
| `GET role-sense.com/robots.txt`               | 200. `Allow: /`, `Allow: /api/og`, **`Disallow: /api/`**, `/dashboard/`, `/intent/`, `/company/`, `/r/` |
| `GET role-sense.com/`                         | **403** Cloudflare challenge (`cf-mitigated: challenge`)               |
| Same URL with a Googlebot UA                  | **403** Cloudflare challenge — no bot prerendering                     |
| `GET role-sense.com/api/jobs`                 | **403** Cloudflare challenge                                           |
| `GET role-sense.com/api/jobs?limit=20`        | **403** Cloudflare challenge                                           |
| `GET role-sense.com/api/v1/jobs`              | **403** Cloudflare challenge                                           |
| `GET role-sense.com/jobs`                     | **403** Cloudflare challenge                                           |
| `GET role-sense.com/feed.xml`                 | **403** Cloudflare challenge                                           |
| `GET role-sense.com/rss`                      | **403** Cloudflare challenge                                           |
| `GET app.role-sense.com/`                     | DNS NXDOMAIN                                                           |

The marketing site states it is **not a job board**. Matches require an account so the
product can score listings against a personal profile. `/api/` is disallowed for every
user-agent except `/api/og` (Open Graph images). HTML, JSON, and RSS all sit behind a
Cloudflare bot challenge, including Googlebot.

Ingesting it would mean solving the challenge, creating an account, storing credentials,
and pulling a gated product's database on a schedule. That is a different activity from
the existing sources, all of which read public unauthenticated feeds, and it is not
something this repo should do. Recorded here so nobody re-investigates.

If RoleSense is wanted specifically, the route is to ask them for API access or a partner
feed, not to automate a login or bypass Cloudflare.

## Do not substitute a RoleSense clone either

RoleSense's differentiator is 26 culture / work-style / motivation signals extracted by
their own model and matched to a signed-in profile. Replicating that on this radar would
be a new product surface (schema, classifier, UI, i18n), not a source adapter, and it is
out of scope here.

The still-open public-feed alternative remains [SPEC-017](017-remoteok-source.md)
(Remote OK).

## Acceptance

No `lib/sources/rolesense/` tree. No ingest registration. No About source entry.

## Out of scope

Remote OK (SPEC-017), Tecla, and any work-style signal extraction over descriptions the
radar already stores.

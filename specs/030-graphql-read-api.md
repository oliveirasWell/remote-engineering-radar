# SPEC-030 — read-only GraphQL API

## Goal

Give other applications (first consumer: the private members area) a
server-to-server read of the jobs the public pages already show. The radar never
calls its consumers.

## Contract

`POST /api/graphql` (`app/api/graphql/route.ts`), built with `graphql-yoga`
6.0.1 and `graphql` 17.0.2. Only `POST` is exported, so Next.js answers other
methods with `405`. GraphiQL and the landing page are disabled and no CORS
headers are sent. The `api/` prefix is already outside the locale rewrites.

```graphql
scalar DateTime

input JobFilter {
  technology: String
  seniority: String
  remote: String
  country: String
  focus: String
  company: String
  minimumScore: Int
}

type Company {
  id: ID!
  name: String!
  slug: String!
  websiteUrl: String
  logoUrl: String
}

type Job {
  id: ID!
  title: String!
  url: String!
  location: String
  remotePolicy: String
  technologies: [String!]!
  seniority: String
  score: Int!
  postedAt: DateTime
  company: Company!
}

type Query {
  jobs(filter: JobFilter, first: Int = 20): [Job!]!
  job(id: ID!): Job
}
```

`clickCount`, `sourceJobId`, `source`, `isActive` and internal timestamps are not
in the schema, so a query naming them fails validation before any read.

## Authentication

`Authorization: Bearer <token>` is compared with `RADAR_API_TOKEN` through
SHA-256 digests and `crypto.timingSafeEqual`. A missing or malformed header, a
wrong token, or an unset variable returns `401` with `WWW-Authenticate: Bearer`
(fail closed). `RADAR_API_TOKEN` is in `.env.example`, and
`scripts/check-boundaries.sh` rejects any `NEXT_PUBLIC_RADAR_API_TOKEN`.

## Resolution

- `jobs` runs the filter through `parseJobFilters`, the jobs page's parser, so an
  unknown value is dropped rather than becoming a new `use cache` key. It always
  reads the page-sized list (`JOBS_PAGE_LIMIT`, the same cache entry as `/jobs`
  with the same filters) and slices it to `first`, clamped to
  `1..JOBS_PAGE_LIMIT`.
- `job` reuses `parse-job-id.ts`; an invalid id returns `null` without a read,
  and an unknown or ineligible id returns `null` from `getJobDetailData`.
- `seniority` and `company { id name slug websiteUrl logoUrl }` were added to the
  report projection (`ReportJobListing` in `lib/report/types.ts`), not queried
  from the route. A listing whose company row is missing is skipped because
  `Company!` is non-null.
- Unexpected errors are masked by yoga's default `maskedErrors`.

## Verification

Route-boundary tests (`app/api/graphql/route.test.ts`): the `401` cases, the
exact `200` shapes of `jobs` and `job`, clamping of `first`, an unknown filter
value dropped, a non-exposed field rejected, and `null` for invalid and unknown
ids. `lib/report/get-jobs-page-data.test.ts` covers the new projection fields.

## Known debt

- `logoUrl` and per-job `seniority` are in the requested schema but no public
  page renders them yet (seniority is only a filter); confirm they may stay
  public.
- The new projection fields also reach the `/jobs` client payload, and
  `companyName`/`companyId` now duplicate `company.name`/`company.id`. Fold the
  card onto `company` when the UI next touches it.
- Introspection is enabled for authenticated callers. There is no rate limit
  beyond the token; add one if the token is ever shared with a third party.
- Token rotation means updating both Vercel projects at once; there is no
  overlap window for two valid tokens.

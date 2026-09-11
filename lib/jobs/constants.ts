/**
 * Max age for jobs shown in reports and kept active after ingest. Starts equal
 * to the hiring-signal window but is a separate policy: retuning how far back a
 * signal looks must not silently change what the site serves.
 */
export const JOB_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

export const REMOTE_POLICY_REMOTE = 'remote' as const;

export const JOB_SORT_OPTIONS = ['newest', 'relevance'] as const;
export type JobSort = (typeof JOB_SORT_OPTIONS)[number];
export const DEFAULT_JOB_SORT: JobSort = 'newest';

/**
 * How long a deactivated job is kept before it is deleted. Twice the display
 * window, so hiring-signal history stays intact while the table stops growing
 * without bound.
 */
export const JOB_RETENTION_MS = 1000 * 60 * 60 * 24 * 60;

export const JOB_COUNTRY_FILTER_OPTIONS = [
  { slug: 'brazil', label: 'Brazil' },
  { slug: 'chile', label: 'Chile' },
  { slug: 'argentina', label: 'Argentina' },
  { slug: 'mexico', label: 'Mexico' },
  { slug: 'colombia', label: 'Colombia' },
  { slug: 'united-states', label: 'United States' },
  { slug: 'ukraine', label: 'Ukraine' },
  { slug: 'worldwide', label: 'Worldwide' },
] as const;

export type JobCountrySlug =
  (typeof JOB_COUNTRY_FILTER_OPTIONS)[number]['slug'];

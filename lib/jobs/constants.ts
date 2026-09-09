/** Max age for jobs shown in reports and kept active after ingest. */
export { RECENT_HIRING_WINDOW_MS as JOB_MAX_AGE_MS } from '@/lib/hiring-signals/constants';

export const REMOTE_POLICY_REMOTE = 'remote' as const;

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
  { slug: 'worldwide', label: 'Worldwide' },
] as const;

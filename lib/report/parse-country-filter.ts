import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';

const ALLOWED_COUNTRY_SLUGS = new Set(
  JOB_COUNTRY_FILTER_OPTIONS.map((option) => option.slug),
);

export const parseCountryFilter = (
  value: string | string[] | undefined,
): string | undefined => {
  const raw =
    typeof value === 'string' ? value.trim().toLowerCase() : undefined;
  if (
    !raw ||
    !ALLOWED_COUNTRY_SLUGS.has(
      raw as (typeof JOB_COUNTRY_FILTER_OPTIONS)[number]['slug'],
    )
  ) {
    return undefined;
  }
  return raw;
};

import {
  JOB_COUNTRY_FILTER_OPTIONS,
  type JobCountrySlug,
} from '@/lib/jobs/constants';

export const parseCountryFilter = (
  value: string | string[] | undefined,
): JobCountrySlug | undefined => {
  const raw =
    typeof value === 'string' ? value.trim().toLowerCase() : undefined;
  return JOB_COUNTRY_FILTER_OPTIONS.find((option) => option.slug === raw)?.slug;
};

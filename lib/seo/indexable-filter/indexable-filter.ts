import {
  JOB_COUNTRY_FILTER_OPTIONS,
  JOB_FOCUS_FILTER_OPTIONS,
  type JobCountrySlug,
  type JobFocusSlug,
} from '@/lib/jobs/constants';

export type IndexableFilter =
  | { country: JobCountrySlug; focus?: undefined }
  | { country?: undefined; focus: JobFocusSlug };

/** Every single-filter view search engines may see, if it has enough jobs. */
export const INDEXABLE_FILTERS: readonly IndexableFilter[] = [
  ...JOB_COUNTRY_FILTER_OPTIONS.map(({ slug }) => ({ country: slug })),
  ...JOB_FOCUS_FILTER_OPTIONS.map(({ slug }) => ({ focus: slug })),
];

/**
 * The view's filter when it is exactly one country or one focus and nothing
 * else; combinations and extra filters are never indexed.
 */
export const singleIndexableFilter = (
  filters: Record<string, string | number | undefined>,
): IndexableFilter | undefined => {
  const { country, focus, ...rest } = filters;
  if (Object.values(rest).some((value) => value !== undefined)) {
    return undefined;
  }
  return INDEXABLE_FILTERS.find(
    (filter) => filter.country === country && filter.focus === focus,
  );
};

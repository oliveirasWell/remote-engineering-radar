import {
  JOB_FOCUS_FILTER_OPTIONS,
  type JobFocusSlug,
} from '@/lib/jobs/constants';

export const parseFocusFilter = (
  value: string | string[] | undefined,
): JobFocusSlug | undefined => {
  const raw =
    typeof value === 'string' ? value.trim().toLowerCase() : undefined;
  return JOB_FOCUS_FILTER_OPTIONS.find((option) => option.slug === raw)?.slug;
};

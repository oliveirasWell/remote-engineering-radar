import { FOCUS_STACK_LABEL } from '../constants';

export const JOBS_PAGE_COPY = {
  title: 'Jobs',
  subtitle: `Search remote senior frontend and fullstack openings in ${FOCUS_STACK_LABEL}.`,
  metaTitle: `Jobs in ${FOCUS_STACK_LABEL}`,
  filtersHeading: 'Filters',
  technology: 'Technology',
  seniority: 'Seniority',
  remote: 'Remote policy',
  location: 'Location',
  minimumScore: 'Minimum score',
  apply: 'Apply filters',
  empty: 'No active jobs match these filters.',
  notFound: 'This job is inactive or was not found.',
  backToJobs: 'Back to jobs',
} as const;

export const MAX_JOB_FILTER_LENGTH = 100;
export const JOBS_PAGE_LIMIT = 100;

import {
  JOB_REMOTE_POLICIES,
  JOB_SENIORITY_LEVELS,
  TECHNOLOGY_NAMES,
} from '@/lib/classification/constants';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { FOCUS_STACK_LABEL } from '../constants';

export const JOBS_PAGE_COPY = {
  title: 'Jobs',
  subtitle: `Search remote senior frontend and fullstack openings in ${FOCUS_STACK_LABEL}.`,
  metaTitle: `Jobs in ${FOCUS_STACK_LABEL}`,
  filtersHeading: 'Filters',
  technology: 'Technology',
  seniority: 'Seniority',
  remote: 'Remote policy',
  country: 'Country',
  anyOption: 'Any',
  minimumScore: 'Minimum score',
  apply: 'Apply filters',
  empty: 'No active jobs match these filters.',
  notFound: 'This job is inactive or was not found.',
  backToJobs: 'Back to jobs',
  loading: 'Loading jobs…',
  whyRelevant: 'Why this is relevant:',
} as const;

export const JOBS_PAGE_LIMIT = 100;

const toOptions = (values: readonly string[]) =>
  values.map((value) => ({ value, label: value }));

/**
 * The filters the jobs page offers. Every option is a value the query already
 * understands, which is what keeps the `use cache` key space finite.
 */
export const JOB_FILTER_FIELDS = [
  {
    name: 'technology',
    label: JOBS_PAGE_COPY.technology,
    options: toOptions(TECHNOLOGY_NAMES),
  },
  {
    name: 'seniority',
    label: JOBS_PAGE_COPY.seniority,
    options: toOptions(JOB_SENIORITY_LEVELS),
  },
  {
    name: 'remote',
    label: JOBS_PAGE_COPY.remote,
    options: toOptions(JOB_REMOTE_POLICIES),
  },
  {
    name: 'country',
    label: JOBS_PAGE_COPY.country,
    options: JOB_COUNTRY_FILTER_OPTIONS.map(({ slug, label }) => ({
      value: slug,
      label,
    })),
  },
] as const;

import 'server-only';
import { cacheLife } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import {
  JOB_MAX_AGE_MS,
  type JobCountrySlug,
  type JobFocusSlug,
} from '@/lib/jobs/constants';
import { SITEMAP_CACHE_LIFE } from './constants';

/** Jobs the site lists under one country or focus filter. */
export const filterJobCount = async (filter: {
  country?: JobCountrySlug;
  focus?: JobFocusSlug;
}): Promise<number> => {
  'use cache';
  cacheLife(SITEMAP_CACHE_LIFE);
  return createJobsRepository(getDb()).countActive({
    ...filter,
    maxAgeMs: JOB_MAX_AGE_MS,
  });
};

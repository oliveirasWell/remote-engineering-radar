import 'server-only';
import { cacheLife } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { SITEMAP_CACHE_LIFE } from './constants';

export const sitemapJobs = async () => {
  'use cache';
  cacheLife(SITEMAP_CACHE_LIFE);
  return createJobsRepository(getDb()).listSitemapJobs();
};

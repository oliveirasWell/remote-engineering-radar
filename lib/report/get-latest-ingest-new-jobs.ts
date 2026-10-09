import { cacheLife } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { REPORT_CACHE_LIFE } from './constants';
import { logReportError } from './log-report-error';
import { readLatestIngestNewJobs } from './read-latest-ingest-new-jobs';

export const getLatestIngestNewJobs = async (): Promise<number | null> => {
  'use cache';
  cacheLife(REPORT_CACHE_LIFE);

  try {
    return await readLatestIngestNewJobs(getDb());
  } catch (error) {
    logReportError('latest-ingest-new-jobs', error);
    return null;
  }
};

import { reclassifyActiveJobs } from '@/lib/ingestion/reclassify-active-jobs';
import { LANE_STRATEGIES_DATA_MIGRATION } from './constants';
import type { DataMigration } from './types';

/**
 * Applied once, in order, after `prisma migrate deploy`. A migration here
 * runs the current classifier, so it must only be registered in the same
 * change that ships the classifier it expects.
 */
export const DATA_MIGRATIONS: readonly DataMigration[] = [
  {
    name: LANE_STRATEGIES_DATA_MIGRATION,
    up: async (db) => {
      await reclassifyActiveJobs(db);
    },
  },
];

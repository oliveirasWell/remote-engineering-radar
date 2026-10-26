import type { Db } from '@/lib/db/client';
import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { INGEST_NEW_JOBS_LOOKBACK_MS } from './constants';
import type { LatestIngest } from './types';

export const readLatestIngestNewJobs = async (
  db: Db,
): Promise<LatestIngest | null> => {
  const runs = await db.ingestionRun.findMany({
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
    take: 2,
  });
  const latest = runs[0];
  if (!latest) {
    return null;
  }

  const windowStart =
    runs[1]?.completedAt ??
    new Date(latest.completedAt.getTime() - INGEST_NEW_JOBS_LOOKBACK_MS);

  const newJobs = await db.job.count({
    where: {
      isActive: true,
      remotePolicy: REMOTE_POLICY_REMOTE,
      firstSeenAt: { gt: windowStart, lte: latest.completedAt },
    },
  });
  return { newJobs, completedAt: latest.completedAt };
};

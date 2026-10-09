import type { Prisma } from '@prisma/client';
import type { JobSort } from '@/lib/jobs/constants';

/** Keeps one ingestion upsert under the request query timeout. */
export const JOB_UPSERT_BATCH_SIZE = 500;

export const JOB_ORDER_BY: Record<
  JobSort,
  Prisma.JobOrderByWithRelationInput[]
> = {
  newest: [
    { postedAt: { sort: 'desc', nulls: 'last' } },
    { score: 'desc' },
    { id: 'asc' },
  ],
  relevance: [{ score: 'desc' }, { postedAt: 'desc' }],
};

import type { Prisma } from '@prisma/client';
import type { JobSort } from '@/lib/jobs/constants';

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

import type { Prisma } from '@prisma/client';

/**
 * Mirrors `coalesce(posted_at, first_seen_at) <operator> cutoff`. Prisma has no
 * `coalesce`, so the fallback to `first_seen_at` is spelled out as an OR branch.
 */
export const coalescedPostedAtFilter = (
  operator: 'gte' | 'lt',
  cutoff: Date,
): Prisma.JobWhereInput => ({
  OR: [
    { postedAt: { [operator]: cutoff } },
    { postedAt: null, firstSeenAt: { [operator]: cutoff } },
  ],
});

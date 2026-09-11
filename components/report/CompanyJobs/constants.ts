import type { JobSort } from '@/lib/jobs/constants';
import type { ReportJobCard } from '@/lib/report/types';

const comparePublicationDates = (
  a: ReportJobCard,
  b: ReportJobCard,
): number => {
  if (!a.postedAt) {
    return b.postedAt ? 1 : 0;
  }
  if (!b.postedAt) {
    return -1;
  }
  return b.postedAt.getTime() - a.postedAt.getTime();
};

export const JOB_COMPARATORS: Record<
  JobSort,
  (a: ReportJobCard, b: ReportJobCard) => number
> = {
  newest: (a, b) =>
    comparePublicationDates(a, b) ||
    b.score - a.score ||
    a.id.localeCompare(b.id),
  relevance: (a, b) =>
    b.score - a.score ||
    comparePublicationDates(a, b) ||
    a.id.localeCompare(b.id),
};

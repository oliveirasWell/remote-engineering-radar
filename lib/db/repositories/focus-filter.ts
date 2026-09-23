import type { Prisma } from '@prisma/client';
import {
  DATA_ANNOTATION_ROLE_FOCUS,
  MOBILE_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  REACT_ROLE_FOCUS,
} from '@/lib/classification/constants';
import type { LaneRoleFocus } from '@/lib/classification/lanes/types';
import {
  JOB_FOCUS_CLOUD_OPS,
  JOB_FOCUS_DATA_ANNOTATION,
  JOB_FOCUS_ENGINEERING,
  JOB_FOCUS_MOBILE,
  JOB_FOCUS_PRODUCT,
  type JobFocusSlug,
} from '@/lib/jobs/constants';

/**
 * Every chip is the presence of its lane's role focus, and a job is on at
 * most one lane, so the chips are disjoint. Jobs no lane claimed appear only
 * under "All roles".
 */
const TRACK_ROLE_FOCUS: Readonly<Record<JobFocusSlug, LaneRoleFocus>> = {
  [JOB_FOCUS_ENGINEERING]: REACT_ROLE_FOCUS,
  [JOB_FOCUS_CLOUD_OPS]: PLATFORM_ROLE_FOCUS,
  [JOB_FOCUS_MOBILE]: MOBILE_ROLE_FOCUS,
  [JOB_FOCUS_DATA_ANNOTATION]: DATA_ANNOTATION_ROLE_FOCUS,
  [JOB_FOCUS_PRODUCT]: PRODUCT_ROLE_FOCUS,
};

export const focusFilter = (
  focus: JobFocusSlug | undefined,
): Prisma.JobWhereInput =>
  focus === undefined
    ? {}
    : { roleFocus: { array_contains: [TRACK_ROLE_FOCUS[focus]] } };

import type { Prisma } from '@prisma/client';
import {
  DATA_ANNOTATION_ROLE_FOCUS,
  PLATFORM_ROLE_FOCUS,
  PRODUCT_ROLE_FOCUS,
  REACT_ROLE_FOCUS,
} from '@/lib/classification/constants';
import {
  JOB_FOCUS_CLOUD_OPS,
  JOB_FOCUS_DATA_ANNOTATION,
  JOB_FOCUS_ENGINEERING,
  JOB_FOCUS_PRODUCT,
  type JobFocusSlug,
} from '@/lib/jobs/constants';

const containsRoleFocus = (roleFocus: string): Prisma.JobWhereInput => ({
  roleFocus: { array_contains: [roleFocus] },
});

const TRACK_ROLE_FOCUS = {
  [JOB_FOCUS_CLOUD_OPS]: PLATFORM_ROLE_FOCUS,
  [JOB_FOCUS_DATA_ANNOTATION]: DATA_ANNOTATION_ROLE_FOCUS,
  [JOB_FOCUS_PRODUCT]: PRODUCT_ROLE_FOCUS,
} as const;

/**
 * Cloud & Ops, Data Annotation, and Product are each the presence of their
 * role focus. React Engineering is the React-term basket on none of those
 * tracks, so the chips stay disjoint; software jobs that miss the basket
 * appear only under "All roles".
 */
export const focusFilter = (
  focus: JobFocusSlug | undefined,
): Prisma.JobWhereInput => {
  if (focus === undefined) {
    return {};
  }
  return focus === JOB_FOCUS_ENGINEERING
    ? {
        ...containsRoleFocus(REACT_ROLE_FOCUS),
        NOT: Object.values(TRACK_ROLE_FOCUS).map(containsRoleFocus),
      }
    : containsRoleFocus(TRACK_ROLE_FOCUS[focus]);
};

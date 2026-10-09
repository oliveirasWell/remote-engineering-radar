import { getDb } from '@/lib/db/client';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { JOB_CLICK_ERRORS, JOB_ID_PATTERN } from '@/lib/jobs/constants';

export type JobClickResult =
  | { ok: true; clickCount: number }
  | {
      ok: false;
      error: (typeof JOB_CLICK_ERRORS)[keyof typeof JOB_CLICK_ERRORS];
    };

export const recordJobClick = async (
  jobId: unknown,
): Promise<JobClickResult> => {
  if (typeof jobId !== 'string' || !JOB_ID_PATTERN.test(jobId)) {
    return { ok: false, error: JOB_CLICK_ERRORS.invalid };
  }

  const clickCount =
    await createJobsRepository(getDb()).incrementClickCount(jobId);
  return clickCount === null
    ? { ok: false, error: JOB_CLICK_ERRORS.missing }
    : { ok: true, clickCount };
};

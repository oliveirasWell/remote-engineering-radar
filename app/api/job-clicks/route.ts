import { JOB_CLICK_ERRORS } from '@/lib/jobs/constants';
import {
  recordJobClick,
  type JobClickResult,
} from '@/lib/jobs/record-job-click';

const JOB_CLICK_STATUS = {
  [JOB_CLICK_ERRORS.invalid]: 400,
  [JOB_CLICK_ERRORS.missing]: 404,
} as const;

const readJobId = async (request: Request): Promise<unknown> => {
  const body = (await request.json().catch(() => null)) as {
    jobId?: unknown;
  } | null;
  return body?.jobId;
};

const responseFor = (result: JobClickResult): Response =>
  result.ok
    ? Response.json({ clickCount: result.clickCount })
    : Response.json(
        { error: result.error },
        { status: JOB_CLICK_STATUS[result.error] },
      );

export const POST = async (request: Request): Promise<Response> =>
  responseFor(await recordJobClick(await readJobId(request)));

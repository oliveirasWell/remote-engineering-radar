import { JOB_CLICK_ERRORS } from '@/lib/jobs/constants';
import { recordJobClick } from '@/lib/jobs/record-job-click';
import { POST } from './route';

const JOB_ID = '00000000-0000-4000-8000-000000000002';
const CLICK_COUNT = 4;

vi.mock('@/lib/jobs/record-job-click', () => ({
  recordJobClick: vi.fn(),
}));

const postJobId = (jobId: unknown) =>
  POST(
    new Request('http://localhost/api/job-clicks', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jobId }),
    }),
  );

describe('POST /api/job-clicks', () => {
  it('returns the updated click count', async () => {
    vi.mocked(recordJobClick).mockResolvedValueOnce({
      ok: true,
      clickCount: CLICK_COUNT,
    });

    const response = await postJobId(JOB_ID);

    expect(recordJobClick).toHaveBeenCalledWith(JOB_ID);
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ clickCount: CLICK_COUNT });
  });

  it.each([
    { error: JOB_CLICK_ERRORS.invalid, status: 400 },
    { error: JOB_CLICK_ERRORS.missing, status: 404 },
  ])('returns $status when the click is $error', async ({ error, status }) => {
    vi.mocked(recordJobClick).mockResolvedValueOnce({ ok: false, error });

    const response = await postJobId(JOB_ID);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({ error });
  });
});

import { getDb } from '@/lib/db/client';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { getCompaniesPageData } from './get-companies-page-data';
import { getJobDetailData, getJobsPageData } from './get-jobs-page-data';
import { logReportError } from './log-report-error';
import { TEST_JOB_ID, TEST_REPORT_ERROR_MESSAGE } from './test-fixtures';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock('./log-report-error', () => ({ logReportError: vi.fn() }));

describe.each([
  {
    operation: 'companies',
    read: () => getCompaniesPageData(),
    empty: { companies: [], country: undefined, updatedAt: null },
  },
  {
    operation: 'jobs',
    read: () => getJobsPageData(),
    empty: { jobs: [] },
  },
  {
    operation: 'job detail',
    read: () => getJobDetailData(TEST_JOB_ID),
    empty: { job: null },
  },
])('$operation cached reader failures', ({ operation, read, empty }) => {
  beforeEach(() => {
    vi.mocked(getDb).mockReset();
    vi.mocked(logReportError).mockClear();
  });

  it('logs and rethrows DB acquisition failures rather than returning cacheable error data', async () => {
    const error = new Error(TEST_REPORT_ERROR_MESSAGE);
    vi.mocked(getDb).mockImplementationOnce(() => {
      throw error;
    });

    await expect(read()).rejects.toBe(error);
    expect(logReportError).toHaveBeenCalledExactlyOnceWith(operation, error);
  });

  it('logs and rejects async query failures and can succeed on the next invocation', async () => {
    const db = await createTestDb();
    vi.mocked(getDb).mockReturnValue(db);
    const error = new Error(TEST_REPORT_ERROR_MESSAGE);
    const query = vi.spyOn(db.$client, 'query').mockRejectedValueOnce(error);

    try {
      await expect(read()).rejects.toMatchObject({ cause: error });
      expect(logReportError).toHaveBeenCalledExactlyOnceWith(
        operation,
        expect.objectContaining({ cause: error }),
      );
      await expect(read()).resolves.toStrictEqual(empty);
    } finally {
      query.mockRestore();
      await db.$client.close();
    }
  });
});

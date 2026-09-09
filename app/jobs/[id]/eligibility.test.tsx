import type { Job } from '@/lib/jobs/types';
import { getDb } from '@/lib/db/client';
import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import {
  TEST_JOB_ID,
  TEST_REPORT_ERROR_MESSAGE,
} from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import JobDetail, { generateMetadata } from './page';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock('@/lib/db/repositories/jobs-repository', () => ({
  createJobsRepository: vi.fn(),
}));
vi.mock('@/lib/db/repositories/companies-repository', () => ({
  createCompaniesRepository: vi.fn(),
}));
vi.mock('@/lib/report/log-report-error', () => ({ logReportError: vi.fn() }));

const NOW = new Date('2026-09-09T12:00:00Z');
const CUTOFF = new Date(NOW.getTime() - JOB_MAX_AGE_MS);
const EXPIRED = new Date(CUTOFF.getTime() - 1);
const PROPS = { params: Promise.resolve({ id: TEST_JOB_ID }) };
const readMetadata = () => generateMetadata(PROPS);
const readPage = () => resolvePageSection(JobDetail(PROPS));
const createJob = (overrides: Partial<Job> = {}): Job => ({
  ...TEST_JOB,
  id: TEST_JOB_ID,
  companyId: TEST_COMPANY.slug,
  technologies: [...TEST_JOB.technologies],
  geographies: [],
  countries: [],
  postedAt: NOW,
  firstSeenAt: NOW,
  lastSeenAt: NOW,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

describe.each([readMetadata, readPage])(
  'detail eligibility through the real cached reader (%s)',
  (read) => {
    const findById = vi.fn();
    const findCompany = vi.fn();

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(NOW);
      findById.mockReset();
      findCompany.mockReset().mockResolvedValue(TEST_COMPANY);
      vi.mocked(createJobsRepository).mockReturnValue({
        findById,
      } as unknown as ReturnType<typeof createJobsRepository>);
      vi.mocked(createCompaniesRepository).mockReturnValue({
        findById: findCompany,
      } as unknown as ReturnType<typeof createCompaniesRepository>);
      vi.mocked(getDb).mockReset();
    });

    afterEach(() => vi.useRealTimers());

    it.each([
      null,
      createJob({ isActive: false }),
      createJob({ postedAt: EXPIRED }),
      createJob({ postedAt: null, firstSeenAt: EXPIRED }),
      createJob({ remotePolicy: 'hybrid' }),
      createJob({ remotePolicy: 'onsite' }),
      createJob({ remotePolicy: null }),
    ])(
      'throws the framework 404 for missing/ineligible data %#',
      async (job) => {
        findById.mockResolvedValueOnce(job);
        await expect(read()).rejects.toMatchObject({
          digest: 'NEXT_HTTP_ERROR_FALLBACK;404',
        });
        expect(findById).toHaveBeenCalledExactlyOnceWith(TEST_JOB_ID);
        expect(findCompany).not.toHaveBeenCalled();
      },
    );

    it.each([
      createJob({ postedAt: CUTOFF }),
      createJob({ postedAt: null, firstSeenAt: CUTOFF }),
    ])('accepts the inclusive 30-day boundary %#', async (job) => {
      findById.mockResolvedValueOnce(job);
      await expect(read()).resolves.toBeDefined();
      expect(findCompany).toHaveBeenCalledExactlyOnceWith(job.companyId);
    });

    it('preserves DB acquisition failures instead of confusing an outage with a missing job', async () => {
      const error = new Error(TEST_REPORT_ERROR_MESSAGE);
      vi.mocked(getDb).mockImplementationOnce(() => {
        throw error;
      });
      await expect(read()).rejects.toBe(error);
      expect(findById).not.toHaveBeenCalled();
    });
  },
);

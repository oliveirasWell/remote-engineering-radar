import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import {
  getJobDetailData,
  getJobsPageData,
} from '@/lib/report/get-jobs-page-data';
import { TEST_REPORT_JOB } from '@/components/report/test-fixtures';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import {
  TEST_JOB_ID,
  TEST_REPORT_ERROR_MESSAGE,
} from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import Home, { generateMetadata as homeMetadata } from '../page';
import Jobs, { generateMetadata as jobsMetadata } from './page';
import Detail, { generateMetadata as detailMetadata } from './[id]/page';

const { requestCaches } = vi.hoisted(() => ({
  requestCaches: new Set<unknown[]>(),
}));

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  // Model React's per-request Object.is argument identity. Real RSC/status
  // behavior is exercised separately under next start, not by Vitest.
  cache: <T extends (...args: never[]) => unknown>(read: T) => {
    const entries: { args: Parameters<T>; value: ReturnType<T> }[] = [];
    requestCaches.add(entries);
    return (...args: Parameters<T>) => {
      const hit = entries.find(
        (entry) =>
          entry.args.length === args.length &&
          entry.args.every((arg, index) => Object.is(arg, args[index])),
      );
      if (hit) {
        return hit.value;
      }
      const value = read(...args) as ReturnType<T>;
      entries.push({ args, value });
      return value;
    };
  },
}));
vi.mock('@/lib/report/get-companies-page-data', () => ({
  getCompaniesPageData: vi.fn(),
}));
vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(),
  getJobDetailData: vi.fn(),
}));

beforeEach(() => {
  for (const entries of requestCaches) {
    entries.length = 0;
  }
  vi.mocked(getCompaniesPageData)
    .mockReset()
    .mockResolvedValue({ companies: [], updatedAt: null });
  vi.mocked(getJobsPageData).mockReset().mockResolvedValue({ jobs: [] });
  vi.mocked(getJobDetailData)
    .mockReset()
    .mockResolvedValue({ job: { ...TEST_REPORT_JOB, id: TEST_JOB_ID } });
});

describe('metadata and page request reads', () => {
  it('shares home reads across different raw spellings of the same country', async () => {
    const country = JOB_COUNTRY_FILTER_OPTIONS[0].slug;
    await Promise.all([
      homeMetadata({
        searchParams: Promise.resolve({ country: country.toUpperCase() }),
      }),
      resolvePageSection(Home({ searchParams: Promise.resolve({ country }) })),
    ]);
    expect(getCompaniesPageData).toHaveBeenCalledExactlyOnceWith({ country });
  });

  it('shares normalized job queries, not raw parameter object identity or ignored spellings', async () => {
    await Promise.all([
      jobsMetadata({
        searchParams: Promise.resolve({
          minimumScore: '000',
          remote: 'REMOTE',
        }),
      }),
      resolvePageSection(Jobs({ searchParams: Promise.resolve({}) })),
    ]);
    expect(getJobsPageData).toHaveBeenCalledOnce();
    await jobsMetadata({
      searchParams: Promise.resolve({
        country: JOB_COUNTRY_FILTER_OPTIONS[0].slug,
      }),
    });
    expect(getJobsPageData).toHaveBeenCalledTimes(2);
  });

  it('shares the complete detail read with metadata even when UUID case differs', async () => {
    await Promise.all([
      detailMetadata({
        params: Promise.resolve({ id: TEST_JOB_ID.toUpperCase() }),
      }),
      resolvePageSection(
        Detail({ params: Promise.resolve({ id: TEST_JOB_ID }) }),
      ),
    ]);
    expect(getJobDetailData).toHaveBeenCalledExactlyOnceWith(TEST_JOB_ID);
  });

  it('shares an outage rejection within the request but retries the reader on a new request', async () => {
    const error = new Error(TEST_REPORT_ERROR_MESSAGE);
    vi.mocked(getJobsPageData).mockRejectedValueOnce(error);
    const results = await Promise.allSettled([
      jobsMetadata({ searchParams: Promise.resolve({}) }),
      resolvePageSection(Jobs({ searchParams: Promise.resolve({}) })),
    ]);
    expect(results).toStrictEqual([
      { status: 'rejected', reason: error },
      { status: 'rejected', reason: error },
    ]);
    expect(getJobsPageData).toHaveBeenCalledOnce();
    for (const entries of requestCaches) {
      entries.length = 0;
    }
    await expect(
      jobsMetadata({ searchParams: Promise.resolve({}) }),
    ).resolves.toMatchObject({ robots: { index: true, follow: true } });
    expect(getJobsPageData).toHaveBeenCalledTimes(2);
  });
});

import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import JobsPage from './page';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(async () => ({ jobs: [] })),
}));

describe('JobsPage', () => {
  it('ignores ambiguous repeated filter parameters', async () => {
    await JobsPage({
      searchParams: Promise.resolve({
        technology: ['React', 'TypeScript'],
        minimumScore: ['10', '90'],
      }),
    });

    expect(getJobsPageData).toHaveBeenCalledWith({
      technology: undefined,
      seniority: undefined,
      remote: undefined,
      location: undefined,
      minimumScore: undefined,
      limit: 100,
    });
  });
});

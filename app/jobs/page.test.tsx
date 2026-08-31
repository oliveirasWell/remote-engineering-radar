// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import { JOBS_PAGE_COPY } from './constants';
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

  it('shows the focus-stack subtitle for SEO visitors', async () => {
    render(
      await JobsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByRole('heading', { name: JOBS_PAGE_COPY.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(JOBS_PAGE_COPY.subtitle)).toBeInTheDocument();
  });
});

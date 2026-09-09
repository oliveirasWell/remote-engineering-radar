// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { JOBS_PAGE_COPY } from './constants';
import JobsPage from './page';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(async () => ({ jobs: [] })),
}));

describe('JobsPage', () => {
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

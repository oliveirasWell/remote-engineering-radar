// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import { TEST_REPORT_ERROR_MESSAGE } from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import { JOBS_PAGE_COPY, JOBS_PAGE_LIMIT } from './constants';
import JobsPage from './page';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(async () => ({ jobs: [] })),
}));

describe('JobsPage', () => {
  beforeEach(() => {
    vi.mocked(getJobsPageData).mockReset().mockResolvedValue({ jobs: [] });
  });

  it('shows the focus-stack subtitle for SEO visitors', async () => {
    render(
      await resolvePageSection(JobsPage({ searchParams: Promise.resolve({}) })),
    );

    expect(
      screen.getByRole('heading', { name: JOBS_PAGE_COPY.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(JOBS_PAGE_COPY.subtitle)).toBeInTheDocument();
  });

  it('catches errors outside the reader, preserves normalized filters, and recovers on the next invocation', async () => {
    const country = JOB_COUNTRY_FILTER_OPTIONS[0].slug;
    const minimumScore = 90;
    const props = {
      searchParams: Promise.resolve({
        technology: ` ${TEST_JOB.technologies[0].toLowerCase()} `,
        seniority: TEST_JOB.seniority.toUpperCase(),
        remote: TEST_JOB.remotePolicy.toUpperCase(),
        country: country.toUpperCase(),
        minimumScore: String(minimumScore),
      }),
    };
    const filters = {
      technology: TEST_JOB.technologies[0],
      seniority: TEST_JOB.seniority,
      remote: TEST_JOB.remotePolicy,
      country,
      minimumScore,
      limit: JOBS_PAGE_LIMIT,
    };
    vi.mocked(getJobsPageData).mockRejectedValueOnce(
      new Error(TEST_REPORT_ERROR_MESSAGE),
    );

    const section = resolvePageSection(JobsPage(props));
    await expect(section).resolves.toBeDefined();
    const { rerender } = render(await section);

    expect(screen.getByRole('alert').textContent).toBe(REPORT_ERROR_MESSAGE);
    expect(screen.getByText(JOBS_PAGE_COPY.empty)).toBeInTheDocument();
    expect(screen.getByLabelText(JOBS_PAGE_COPY.technology)).toHaveValue(
      filters.technology,
    );
    expect(screen.getByLabelText(JOBS_PAGE_COPY.seniority)).toHaveValue(
      filters.seniority,
    );
    expect(screen.getByLabelText(JOBS_PAGE_COPY.remote)).toHaveValue(
      filters.remote,
    );
    expect(screen.getByLabelText(JOBS_PAGE_COPY.country)).toHaveValue(country);
    expect(screen.getByLabelText(JOBS_PAGE_COPY.minimumScore)).toHaveValue(
      minimumScore,
    );

    rerender(await resolvePageSection(JobsPage(props)));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByText(JOBS_PAGE_COPY.empty)).toBeInTheDocument();
    expect(vi.mocked(getJobsPageData).mock.calls).toStrictEqual([
      [filters],
      [filters],
    ]);
  });
});

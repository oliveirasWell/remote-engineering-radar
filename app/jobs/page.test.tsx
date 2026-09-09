// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { JOBS_PAGE_COPY, JOBS_PAGE_LIMIT } from './constants';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import { I18N_TEST } from '../i18n-fixtures';
import { TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { TEST_REPORT_ERROR_MESSAGE } from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import JobsPage from './page';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(async () => ({ jobs: [] })),
}));

const FILTERS = { country: 'brazil', seniority: 'senior' } as const;

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('JobsPage', () => {
  beforeEach(() => {
    vi.mocked(getJobsPageData).mockReset().mockResolvedValue({ jobs: [] });
  });

  it('translates the static heading and streaming fallback', () => {
    document.cookie = `${LOCALE_COOKIE}=${I18N_TEST.portuguese}; path=/`;
    const page = JobsPage({ searchParams: Promise.resolve({}) });
    render(
      <I18nProvider>
        {page.props.children[0]}
        {page.props.children[1].props.fallback}
      </I18nProvider>,
    );
    const { jobs } = messagesFor(I18N_TEST.portuguese);
    expect(
      screen.getByRole('heading', { name: jobs.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(jobs.subtitle)).toBeInTheDocument();
    expect(screen.getByText(jobs.loading)).toBeInTheDocument();
  });

  it('translates every filter option and empty/error state without changing query values', async () => {
    const messages = messagesFor(I18N_TEST.portuguese);
    document.cookie = `${LOCALE_COOKIE}=${I18N_TEST.portuguese}; path=/`;
    vi.mocked(getJobsPageData).mockRejectedValueOnce(
      new Error(TEST_REPORT_ERROR_MESSAGE),
    );
    const page = JobsPage({ searchParams: Promise.resolve(FILTERS) });
    render(<I18nProvider>{await resolvePageSection(page)}</I18nProvider>);

    expect(
      screen.getByRole('button', { name: messages.jobs.apply }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(messages.jobs.country)).toHaveValue(
      FILTERS.country,
    );
    expect(screen.getByLabelText(messages.jobs.seniority)).toHaveValue(
      FILTERS.seniority,
    );
    for (const options of [
      messages.countries,
      messages.seniority,
      messages.remote,
    ]) {
      for (const [value, label] of Object.entries(options)) {
        expect(screen.getByRole('option', { name: label })).toHaveValue(value);
      }
    }
    expect(screen.getByRole('alert')).toHaveTextContent(messages.report.error);
    expect(
      screen.queryByText(TEST_REPORT_ERROR_MESSAGE),
    ).not.toBeInTheDocument();
    expect(screen.getByText(messages.jobs.empty)).toBeInTheDocument();
    expect(getJobsPageData).toHaveBeenLastCalledWith({
      ...FILTERS,
      technology: undefined,
      remote: undefined,
      minimumScore: undefined,
      limit: JOBS_PAGE_LIMIT,
    });
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

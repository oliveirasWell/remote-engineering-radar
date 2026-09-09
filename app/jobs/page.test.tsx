// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { JOBS_PAGE_COPY, JOBS_PAGE_LIMIT } from './constants';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import type { ReactElement, ReactNode } from 'react';
import { I18N_TEST } from '../i18n-fixtures';
import JobsPage from './page';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(async () => ({ jobs: [] })),
}));

const FILTERS = { country: 'brazil', seniority: 'senior' } as const;

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('JobsPage', () => {
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
    vi.mocked(getJobsPageData).mockResolvedValue({
      jobs: [],
      errorMessage: REPORT_ERROR_MESSAGE,
    });
    const page = JobsPage({ searchParams: Promise.resolve(FILTERS) });
    const section = page.props.children[1].props.children as ReactElement<
      Parameters<typeof JobsPage>[0],
      (props: Parameters<typeof JobsPage>[0]) => Promise<ReactNode>
    >;
    render(<I18nProvider>{await section.type(section.props)}</I18nProvider>);

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

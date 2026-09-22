// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { DEFAULT_JOB_SORT, JOB_SORT_OPTIONS } from '@/lib/jobs/constants';
import {
  EN_MESSAGES,
  LOCALE_COOKIE,
  PT_BR_MESSAGES,
} from '@/lib/i18n/messages';
import { CompanyJobs } from './CompanyJobs';
import {
  NEWEST_JOB_TITLES,
  RELEVANT_JOB_TITLES,
  SORTING_JOBS,
} from './fixtures/jobs';

const PORTUGUESE_LOCALE = 'pt-BR';
const ALL_JOBS_HREF = '/jobs?company=example-company';

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('CompanyJobs', () => {
  it('defaults to newest first, breaks date ties by relevance, and puts undated jobs last', () => {
    const inputOrder = SORTING_JOBS.map((job) => job.id);
    render(
      <CompanyJobs
        jobs={SORTING_JOBS}
        totalJobs={SORTING_JOBS.length}
        allJobsHref={ALL_JOBS_HREF}
      />,
    );

    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toEqual(NEWEST_JOB_TITLES);
    expect(
      screen.getByRole('combobox', { name: EN_MESSAGES.jobs.sortLabel }),
    ).toHaveValue(DEFAULT_JOB_SORT);
    expect(SORTING_JOBS.map((job) => job.id)).toEqual(inputOrder);
  });

  it('allows each company to switch its ordering independently', () => {
    render(
      <>
        <CompanyJobs
          jobs={SORTING_JOBS}
          totalJobs={SORTING_JOBS.length}
          allJobsHref={ALL_JOBS_HREF}
        />
        <CompanyJobs
          jobs={SORTING_JOBS}
          totalJobs={SORTING_JOBS.length}
          allJobsHref={ALL_JOBS_HREF}
        />
      </>,
    );

    const selectors = screen.getAllByRole('combobox', {
      name: EN_MESSAGES.jobs.sortLabel,
    });
    fireEvent.change(selectors[0], { target: { value: JOB_SORT_OPTIONS[1] } });

    const titles = screen
      .getAllByRole('heading')
      .map((heading) => heading.textContent);
    expect(titles).toEqual([...RELEVANT_JOB_TITLES, ...NEWEST_JOB_TITLES]);
    expect(selectors[1]).toHaveValue(DEFAULT_JOB_SORT);

    fireEvent.change(selectors[0], { target: { value: DEFAULT_JOB_SORT } });
    expect(
      screen.getAllByRole('heading').map((heading) => heading.textContent),
    ).toEqual([...NEWEST_JOB_TITLES, ...NEWEST_JOB_TITLES]);
  });

  it('translates the ordering control to Portuguese', () => {
    render(
      <I18nProvider locale={PORTUGUESE_LOCALE}>
        <CompanyJobs
          jobs={SORTING_JOBS}
          totalJobs={SORTING_JOBS.length}
          allJobsHref={ALL_JOBS_HREF}
        />
      </I18nProvider>,
    );

    const select = within(
      screen.getByRole('combobox', { name: PT_BR_MESSAGES.jobs.sortLabel }),
    );
    for (const sort of JOB_SORT_OPTIONS) {
      expect(
        select.getByRole('option', {
          name: PT_BR_MESSAGES.jobs.sortOptions[sort],
        }),
      ).toHaveValue(sort);
    }
  });

  it('links to every job of the company when it shows only a preview', () => {
    const totalJobs = SORTING_JOBS.length + 3;
    render(
      <CompanyJobs
        jobs={SORTING_JOBS}
        totalJobs={totalJobs}
        allJobsHref={ALL_JOBS_HREF}
      />,
    );

    expect(
      screen.getByRole('link', {
        name: EN_MESSAGES.home.seeAllJobs(totalJobs),
      }),
    ).toHaveAttribute('href', ALL_JOBS_HREF);
  });

  it('omits the link when every job is already shown', () => {
    render(
      <CompanyJobs
        jobs={SORTING_JOBS}
        totalJobs={SORTING_JOBS.length}
        allJobsHref={ALL_JOBS_HREF}
      />,
    );

    expect(
      screen.queryByRole('link', {
        name: EN_MESSAGES.home.seeAllJobs(SORTING_JOBS.length),
      }),
    ).not.toBeInTheDocument();
  });
});

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

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('CompanyJobs', () => {
  it('defaults to newest first, breaks date ties by relevance, and puts undated jobs last', () => {
    const inputOrder = SORTING_JOBS.map((job) => job.id);
    render(<CompanyJobs jobs={SORTING_JOBS} />);

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
        <CompanyJobs jobs={SORTING_JOBS} />
        <CompanyJobs jobs={SORTING_JOBS} />
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
    document.cookie = `${LOCALE_COOKIE}=${PORTUGUESE_LOCALE}; path=/`;
    render(
      <I18nProvider>
        <CompanyJobs jobs={SORTING_JOBS} />
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
});

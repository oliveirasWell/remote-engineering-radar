// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { JobCard } from './JobCard';
import { HIDDEN_JOBS_STORAGE_KEY, JOB_CARD_COPY } from '../constants';
import { TEST_REPORT_JOB } from '../test-fixtures';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { formatRelativeTime } from '@/lib/report/format';

const job = TEST_REPORT_JOB;
const UNKNOWN_REMOTE_POLICY = 'Remote within selected time zones';
const COMPANY_NAME_FALLBACK = {
  en: 'Unknown company',
  'pt-BR': 'Empresa desconhecida',
};

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('JobCard', () => {
  it('translates actions, confirmation, and relative time without translating job data', () => {
    const locale = 'pt-BR';
    const { jobCard, remote } = messagesFor(locale);
    document.cookie = `${LOCALE_COOKIE}=${locale}; path=/`;
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(
      <I18nProvider>
        <JobCard job={job} />
      </I18nProvider>,
    );
    expect(
      screen.getByRole('link', { name: jobCard.viewOriginal }),
    ).toHaveAttribute('href', job.url);
    expect(
      screen.getByText(
        `${jobCard.postedLabel}: ${formatRelativeTime(job.postedAt, new Date(), locale)}`,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(job.title)).toBeInTheDocument();
    expect(screen.getByText(job.companyName)).toBeInTheDocument();
    expect(
      screen.getByText([remote.remote, job.location].join(' · ')),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: jobCard.hideAction }));
    expect(window.confirm).toHaveBeenCalledWith(jobCard.hideConfirmation);
    expect(screen.getByText(job.title)).toBeInTheDocument();
  });

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it.each(Object.entries(messagesFor('pt-BR').remote))(
    'translates the recognized remote policy %s without changing location',
    (policy, label) => {
      document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
      render(
        <I18nProvider>
          <JobCard job={{ ...job, remotePolicy: policy }} />
        </I18nProvider>,
      );
      expect(
        screen.getByText([label, job.location].join(' · ')),
      ).toBeInTheDocument();
    },
  );

  it.each([UNKNOWN_REMOTE_POLICY, null])(
    'preserves unknown remote policy %s and the original location',
    (policy) => {
      document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
      render(
        <I18nProvider>
          <JobCard job={{ ...job, remotePolicy: policy }} />
        </I18nProvider>,
      );
      expect(
        screen.getByText([policy, job.location].filter(Boolean).join(' · ')),
      ).toBeInTheDocument();
    },
  );

  it.each(['en', 'pt-BR'] as const)(
    'renders the missing-company fallback in %s',
    (locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/`;
      render(
        <I18nProvider>
          <JobCard job={{ ...job, companyName: null }} />
        </I18nProvider>,
      );
      expect(
        screen.getByText(COMPANY_NAME_FALLBACK[locale]),
      ).toBeInTheDocument();
    },
  );

  it('preserves an actual company named like the English fallback', () => {
    document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
    render(
      <I18nProvider>
        <JobCard job={{ ...job, companyName: COMPANY_NAME_FALLBACK.en }} />
      </I18nProvider>,
    );
    expect(screen.getByText(COMPANY_NAME_FALLBACK.en)).toBeInTheDocument();
    expect(
      screen.queryByText(COMPANY_NAME_FALLBACK['pt-BR']),
    ).not.toBeInTheDocument();
  });

  it('renders the original job link without exposing the score', () => {
    render(<JobCard job={job} />);

    expect(
      screen.getByRole('heading', { name: job.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(job.companyName)).toBeInTheDocument();
    expect(
      screen.queryByText((content) => content.includes(String(job.score))),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: JOB_CARD_COPY.viewOriginal }),
    ).toHaveAttribute('href', job.url);
  });

  it('does not render an unsafe original job link', () => {
    render(<JobCard job={{ ...job, url: 'javascript:alert(1)' }} />);

    expect(
      screen.queryByRole('link', { name: JOB_CARD_COPY.viewOriginal }),
    ).not.toBeInTheDocument();
  });

  it('hides a job after confirmation and persists the choice', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<JobCard job={job} />);

    fireEvent.click(
      screen.getByRole('button', { name: JOB_CARD_COPY.hideAction }),
    );

    expect(window.confirm).toHaveBeenCalledWith(JOB_CARD_COPY.hideConfirmation);
    expect(
      screen.queryByRole('heading', { name: job.title }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY)).toBe(
      JSON.stringify([job.id]),
    );
  });

  it('keeps a job visible when hiding is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<JobCard job={job} />);

    fireEvent.click(
      screen.getByRole('button', { name: JOB_CARD_COPY.hideAction }),
    );

    expect(
      screen.getByRole('heading', { name: job.title }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY)).toBeNull();
  });

  it('does not render a previously hidden job', () => {
    localStorage.setItem(HIDDEN_JOBS_STORAGE_KEY, JSON.stringify([job.id]));

    render(<JobCard job={job} />);

    expect(
      screen.queryByRole('heading', { name: job.title }),
    ).not.toBeInTheDocument();
  });
});

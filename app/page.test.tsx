// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { APP_DESCRIPTION, APP_NAME, FOCUS_TECHNOLOGIES } from './constants';
import { HOME_SECTIONS } from './home-constants';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import { I18N_TEST } from './i18n-fixtures';
import Home from './page';

vi.mock('@/lib/report/get-companies-page-data', () => ({
  getCompaniesPageData: vi.fn(),
}));

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

const COUNTRY_TABS = [
  { slug: undefined, label: HOME_SECTIONS.countryAll, href: '/' },
  ...JOB_COUNTRY_FILTER_OPTIONS.map((option) => ({
    ...option,
    href: `/?country=${option.slug}`,
  })),
];

describe('home report copy', () => {
  it('translates the static heading and streaming fallback', () => {
    document.cookie = `${LOCALE_COOKIE}=${I18N_TEST.portuguese}; path=/`;
    const page = Home({ searchParams: Promise.resolve({}) });
    render(
      <I18nProvider>
        {page.props.children[0]}
        {page.props.children[1].props.fallback}
      </I18nProvider>,
    );
    const { home } = messagesFor(I18N_TEST.portuguese);
    expect(screen.getByText(home.subtitle)).toBeInTheDocument();
    expect(screen.getByText(home.loading)).toBeInTheDocument();
  });

  it('exposes brand and section titles for the public report', () => {
    expect(APP_NAME).toBe('Remote Engineering Radar');
    expect(HOME_SECTIONS.companiesToWatch).toBe('Companies to watch');
    expect(HOME_SECTIONS.countryAll).toBe('All countries');
    expect(formatUpdatedLabel(null)).toBe('Updated: —');
  });

  it('names React and the other focus technologies for SEO visitors', () => {
    for (const technology of FOCUS_TECHNOLOGIES) {
      expect(APP_DESCRIPTION).toContain(technology);
      expect(HOME_SECTIONS.subtitle).toContain(technology);
    }
  });
});

describe('home country tabs', () => {
  it('translates country tabs, timestamps, failures, and the empty report without adding locale to the data request', async () => {
    const messages = messagesFor(I18N_TEST.portuguese);
    document.cookie = `${LOCALE_COOKIE}=${I18N_TEST.portuguese}; path=/`;
    vi.mocked(getCompaniesPageData).mockResolvedValue({
      companies: [],
      updatedAt: null,
      errorMessage: REPORT_ERROR_MESSAGE,
    });
    const page = Home({ searchParams: Promise.resolve({}) });
    const section = page.props.children[1].props.children as ReactElement<
      Parameters<typeof Home>[0],
      (props: Parameters<typeof Home>[0]) => Promise<ReactNode>
    >;
    render(<I18nProvider>{await section.type(section.props)}</I18nProvider>);

    expect(
      screen.getByRole('heading', { name: messages.home.companiesToWatch }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(messages.report.error);
    expect(
      screen.getByText(messages.report.emptyCompanies),
    ).toBeInTheDocument();
    expect(screen.getByText(messages.report.updated('—'))).toBeInTheDocument();
    for (const option of JOB_COUNTRY_FILTER_OPTIONS) {
      expect(
        screen.getByRole('link', { name: messages.countries[option.slug] }),
      ).toHaveAttribute('href', `/?country=${option.slug}`);
    }
    expect(getCompaniesPageData).toHaveBeenLastCalledWith({
      country: undefined,
    });
  });

  it.each(COUNTRY_TABS)(
    'marks only $label as selected while preserving every filter link',
    async ({ slug: country, label }) => {
      vi.mocked(getCompaniesPageData).mockResolvedValue({
        companies: [],
        country,
        updatedAt: null,
      });

      const page = Home({ searchParams: Promise.resolve({ country }) });
      // Resolve the async section before rendering; Vitest cannot mount async RSCs.
      const section = page.props.children[1].props.children as ReactElement<
        Parameters<typeof Home>[0],
        (props: Parameters<typeof Home>[0]) => Promise<ReactNode>
      >;
      render(await section.type(section.props));

      const nav = within(
        screen.getByRole('navigation', {
          name: HOME_SECTIONS.countryFilterLabel,
        }),
      );
      const selected = nav.getByRole('link', { name: label });
      expect(selected).toHaveClass(
        'text-foreground',
        'font-semibold',
        'shadow-[inset_0_-2px_0_var(--primary)]',
      );
      expect(nav.getAllByRole('link')).toHaveLength(COUNTRY_TABS.length);

      for (const tab of COUNTRY_TABS) {
        const link = nav.getByRole('link', { name: tab.label });
        expect(link).toHaveAttribute('href', tab.href);
        expect(link).toHaveClass('min-h-[44px]');
        if (tab.slug !== country) {
          expect(link).toHaveClass(
            'text-muted-foreground',
            'underline',
            'underline-offset-2',
          );
          expect(link).not.toHaveClass('font-semibold');
          expect(link).not.toHaveClass(
            'shadow-[inset_0_-2px_0_var(--primary)]',
          );
        }
      }
    },
  );
});

// @vitest-environment jsdom

import { fireEvent, render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { TEST_REPORT_ERROR_MESSAGE } from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import { APP_DESCRIPTION, APP_NAME, FOCUS_TECHNOLOGIES } from './constants';
import { HOME_SECTIONS } from './home-constants';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { TEST_REPORT_COMPANY } from '@/components/report/test-fixtures';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { I18N_TEST } from './i18n-fixtures';
import { CompaniesReport } from './home-presentation';
import Home from './page';
import * as homeRoute from './page';
import PageError from './error';

vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

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
const UNKNOWN_COUNTRIES = ['atlantis', 'unknown-country'];
const UPDATED_AT = new Date('2026-09-01T12:00:00Z');

describe('home report copy', () => {
  it('keeps the update timestamp compact beside the section title and pads company hover rows', async () => {
    vi.mocked(getCompaniesPageData).mockResolvedValueOnce({
      companies: [{ ...TEST_REPORT_COMPANY, jobs: [], signalSourceUrls: [] }],
      updatedAt: UPDATED_AT,
    });
    render(
      await resolvePageSection(Home({ searchParams: Promise.resolve({}) })),
    );

    const heading = screen.getByRole('heading', {
      name: HOME_SECTIONS.companiesToWatch,
    });
    const timestamp = screen.getByText(formatUpdatedLabel(UPDATED_AT));
    expect(timestamp.parentElement).toBe(heading.parentElement);
    expect(timestamp).toHaveClass('text-xs');
    expect(timestamp).toHaveAttribute('datetime', UPDATED_AT.toISOString());
    const summary = screen
      .getByText(TEST_REPORT_COMPANY.name)
      .closest('summary');
    expect(summary).toHaveClass('px-3', 'py-3', 'hover:bg-muted/40');
    expect(summary).toHaveClass('-mx-3');
  });
  it('translates the real error boundary and retries without showing internal errors or an empty report', () => {
    document.cookie = `${LOCALE_COOKIE}=${I18N_TEST.portuguese}; path=/`;
    const { globalError, report } = messagesFor(I18N_TEST.portuguese);
    const retry = vi.fn();
    render(
      <I18nProvider>
        <PageError error={new Error(TEST_REPORT_ERROR_MESSAGE)} retry={retry} />
      </I18nProvider>,
    );
    expect(
      screen.getByRole('heading', { name: globalError.title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      globalError.description,
    );
    expect(
      screen.queryByText(TEST_REPORT_ERROR_MESSAGE),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(report.emptyCompanies)).not.toBeInTheDocument();
    expect(document.querySelector('meta[name="robots"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: globalError.retry }));
    expect(retry).toHaveBeenCalledOnce();
  });
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
  it('translates country tabs, timestamps, and the empty report without adding locale to the data request', async () => {
    const messages = messagesFor(I18N_TEST.portuguese);
    document.cookie = `${LOCALE_COOKIE}=${I18N_TEST.portuguese}; path=/`;
    vi.mocked(getCompaniesPageData).mockResolvedValueOnce({
      companies: [],
      country: undefined,
      updatedAt: null,
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
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.queryByText(TEST_REPORT_ERROR_MESSAGE),
    ).not.toBeInTheDocument();
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

describe('Home cache boundary', () => {
  beforeEach(() => {
    vi.mocked(getCompaniesPageData)
      .mockReset()
      .mockResolvedValue({ companies: [], updatedAt: null });
  });

  it('passes the same argument shape and renders the same result for unknown and absent countries', async () => {
    const { container, rerender } = render(
      await resolvePageSection(Home({ searchParams: Promise.resolve({}) })),
    );
    const unfilteredHtml = container.innerHTML;

    for (const country of [
      ...UNKNOWN_COUNTRIES,
      '',
      '   ',
      JOB_COUNTRY_FILTER_OPTIONS.map((option) => option.slug),
    ]) {
      rerender(
        await resolvePageSection(
          Home({ searchParams: Promise.resolve({ country }) }),
        ),
      );
      expect(container.innerHTML).toBe(unfilteredHtml);
    }

    expect(vi.mocked(getCompaniesPageData).mock.calls).toStrictEqual(
      Array.from({ length: 6 }, () => [{ country: undefined }]),
    );
  });

  it.each(JOB_COUNTRY_FILTER_OPTIONS)(
    'canonicalizes $label before calling the reader',
    async ({ slug }) => {
      await resolvePageSection(
        Home({
          searchParams: Promise.resolve({ country: ` ${slug.toUpperCase()} ` }),
        }),
      );

      expect(getCompaniesPageData).toHaveBeenCalledExactlyOnceWith({
        country: slug,
      });
    },
  );

  it('propagates read failures instead of rendering an empty success and recovers on the next request', async () => {
    const country = JOB_COUNTRY_FILTER_OPTIONS[0];
    const props = {
      searchParams: Promise.resolve({ country: country.slug }),
    };
    vi.mocked(getCompaniesPageData)
      .mockRejectedValueOnce(new Error(TEST_REPORT_ERROR_MESSAGE))
      .mockResolvedValueOnce({
        companies: [],
        country: country.slug,
        updatedAt: UPDATED_AT,
      });

    await expect(resolvePageSection(Home(props))).rejects.toThrow(
      TEST_REPORT_ERROR_MESSAGE,
    );
    render(await resolvePageSection(Home(props)));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByText(formatUpdatedLabel(UPDATED_AT)),
    ).toBeInTheDocument();
    expect(vi.mocked(getCompaniesPageData).mock.calls).toStrictEqual([
      [{ country: country.slug }],
      [{ country: country.slug }],
    ]);
  });

  it('gates metadata on the full read and self-canonicalizes normalized country filters', async () => {
    expect(homeRoute).toHaveProperty('generateMetadata', expect.any(Function));
    const country = JOB_COUNTRY_FILTER_OPTIONS[0].slug;
    const metadata = await homeRoute.generateMetadata({
      searchParams: Promise.resolve({ country: ` ${country.toUpperCase()} ` }),
    });
    expect(metadata).toMatchObject({
      alternates: { canonical: `/?country=${country}` },
      robots: { index: false, follow: true },
    });
    expect(getCompaniesPageData).toHaveBeenCalledExactlyOnceWith({ country });
    const error = new Error(TEST_REPORT_ERROR_MESSAGE);
    vi.mocked(getCompaniesPageData).mockRejectedValueOnce(error);
    await expect(
      homeRoute.generateMetadata({ searchParams: Promise.resolve({}) }),
    ).rejects.toBe(error);
  });

  it.each([undefined, '', '   ', ...UNKNOWN_COUNTRIES])(
    'keeps unfiltered home indexable for ignored country %j',
    async (country) => {
      expect(homeRoute).toHaveProperty(
        'generateMetadata',
        expect.any(Function),
      );
      await expect(
        homeRoute.generateMetadata({
          searchParams: Promise.resolve({ country }),
        }),
      ).resolves.toMatchObject({
        alternates: { canonical: '/' },
        robots: { index: true, follow: true },
      });
    },
  );
});

describe('home company sorting', () => {
  const COMPANIES = [
    {
      ...TEST_REPORT_COMPANY,
      id: 'company-1',
      name: 'Zeta Labs',
      openEngineeringJobs: 2,
      jobs: [],
      signalSourceUrls: [],
    },
    {
      ...TEST_REPORT_COMPANY,
      id: 'company-2',
      name: 'Acme Robotics',
      openEngineeringJobs: 5,
      jobs: [],
      signalSourceUrls: [],
    },
    {
      ...TEST_REPORT_COMPANY,
      id: 'company-3',
      name: 'Nimbus Systems',
      openEngineeringJobs: 9,
      jobs: [],
      signalSourceUrls: [],
    },
  ];
  const NAMES = COMPANIES.map((company) => company.name);
  const orderedNames = () =>
    screen
      .getAllByRole('group')
      .map((row) => NAMES.find((name) => within(row).queryByText(name)));

  it.each([
    { sort: 'default', expected: NAMES },
    {
      sort: 'jobs',
      expected: ['Nimbus Systems', 'Acme Robotics', 'Zeta Labs'],
    },
    {
      sort: 'name',
      expected: ['Acme Robotics', 'Nimbus Systems', 'Zeta Labs'],
    },
  ])('orders the companies by $sort', ({ sort, expected }) => {
    render(
      <I18nProvider>
        <CompaniesReport
          data={{ companies: COMPANIES, updatedAt: UPDATED_AT }}
        />
      </I18nProvider>,
    );

    fireEvent.change(
      screen.getByLabelText(HOME_SECTIONS.sortLabel, { exact: false }),
      { target: { value: sort } },
    );

    expect(orderedNames()).toEqual(expected);
  });
});

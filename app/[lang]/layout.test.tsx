// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { notFound, usePathname, useSearchParams } from 'next/navigation';
import { CompanySummary } from '@/components/report/CompanySummary/CompanySummary';
import { LANGUAGE_OPTIONS } from '@/components/i18n/LanguagePicker/constants';
import { TEST_REPORT_COMPANY } from '@/components/report/test-fixtures';
import { messagesFor } from '@/lib/i18n/messages';
import { getLatestIngestNewJobs } from '@/lib/report/get-latest-ingest-new-jobs';
import GlobalError from '../global-error';
import { HOME_SECTIONS } from './home-constants';
import { I18N_TEST } from './i18n-fixtures';
import RootLayout from './layout';

const ADSENSE_HEADER_SLOT = '6534094031';
const ADSENSE_TEST = vi.hoisted(() => ({
  client: 'ca-pub-1234567890123456',
}));

vi.mock('next/font/google', () => ({ Inter: () => ({ variable: '' }) }));
vi.mock('next/script', () => ({
  default: ({
    src,
    strategy,
    crossOrigin,
  }: {
    src: string;
    strategy: string;
    crossOrigin: string;
  }) => (
    <div
      data-testid="adsense-script"
      data-src={src}
      data-strategy={strategy}
      data-cross-origin={crossOrigin}
    />
  ),
}));
vi.mock('@/lib/marketing/adsense', async () => {
  const actual = await vi.importActual<
    typeof import('@/lib/marketing/adsense')
  >('@/lib/marketing/adsense');
  return {
    ...actual,
    ADSENSE_CLIENT_ID: ADSENSE_TEST.client,
  };
});
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  notFound: vi.fn(() => {
    throw new Error(NOT_FOUND);
  }),
}));
vi.mock('@/components/observability/GoogleAnalytics/GoogleAnalytics', () => ({
  GoogleAnalytics: () => null,
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const LATEST_INGEST_NEW_JOBS = 4;

vi.mock('@/lib/report/get-latest-ingest-new-jobs', () => ({
  getLatestIngestNewJobs: vi.fn(async () => LATEST_INGEST_NEW_JOBS),
}));

const NOT_FOUND = 'NEXT_NOT_FOUND';
const PORTUGUESE_JOBS_PATH = '/pt-BR/jobs';
const COUNTRY_QUERY = 'country=brazil';
const content = <CompanySummary company={TEST_REPORT_COMPANY} />;

const layoutFor = (lang: string) =>
  RootLayout({ params: Promise.resolve({ lang }), children: content });

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
  vi.mocked(usePathname).mockReturnValue('/');
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams() as ReturnType<typeof useSearchParams>,
  );
  vi.restoreAllMocks();
});

describe('site language and navigation', () => {
  it('loads AdSense and the top bar in beta as well as production', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    render(await layoutFor(I18N_TEST.english), { container: document });

    const script = screen.getByTestId('adsense-script');
    expect(script).toHaveAttribute(
      'data-src',
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_TEST.client}`,
    );
    expect(script).toHaveAttribute('data-strategy', 'beforeInteractive');
    expect(script).toHaveAttribute('data-cross-origin', 'anonymous');
    const ad = screen
      .getByRole('complementary', {
        name: messagesFor().marketing.advertisement,
      })
      .querySelector('ins.adsbygoogle');
    expect(ad).toHaveAttribute('data-ad-slot', ADSENSE_HEADER_SLOT);
    expect(ad).toHaveAttribute('data-ad-format', 'auto');
    expect(ad).toHaveAttribute('data-full-width-responsive', 'true');
  });

  it('shares navigation, PT/EN language links, and a safe repository footer', async () => {
    render(await layoutFor(I18N_TEST.english), { container: document });

    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: I18N_TEST.about })).toHaveAttribute(
      'href',
      '/about',
    );
    const languages = within(
      header.getByRole('group', { name: I18N_TEST.language }),
    );
    expect(languages.getAllByRole('link')).toHaveLength(
      LANGUAGE_OPTIONS.length,
    );
    for (const { value, label } of LANGUAGE_OPTIONS) {
      const link = languages.getByRole('link', {
        name: messagesFor().navigation.languages[value],
      });
      expect(link).toHaveTextContent(label);
      expect(link).toHaveAttribute('lang', value);
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      if (value === I18N_TEST.english) {
        expect(link).toHaveAttribute('aria-current', 'true');
      } else {
        expect(link).not.toHaveAttribute('aria-current');
      }
    }
    const github = within(screen.getByRole('contentinfo')).getByRole('link', {
      name: I18N_TEST.github,
    });
    expect(github).toHaveAttribute('href', I18N_TEST.repositoryUrl);
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noreferrer');
  });

  it('renders Portuguese on the server for a Portuguese URL', async () => {
    const html = renderToString(await layoutFor(I18N_TEST.portuguese));

    expect(html).toContain(`<html lang="${I18N_TEST.portuguese}"`);
    expect(html).toContain(I18N_TEST.portugueseOpenRoles);
    expect(html).not.toContain(
      HOME_SECTIONS.openRoles(TEST_REPORT_COMPANY.openEngineeringJobs),
    );
    expect(html).toContain('href="/pt-BR/about"');
  });

  it('links each language to the same page and filters and remembers the choice', async () => {
    vi.mocked(usePathname).mockReturnValue(PORTUGUESE_JOBS_PATH);
    vi.mocked(useSearchParams).mockReturnValue(
      new URLSearchParams(COUNTRY_QUERY) as ReturnType<typeof useSearchParams>,
    );
    render(await layoutFor(I18N_TEST.portuguese), { container: document });
    const languages = within(
      screen.getByRole('group', { name: I18N_TEST.portugueseLanguage }),
    );
    const portugueseNames = messagesFor(I18N_TEST.portuguese).navigation
      .languages;
    const english = languages.getByRole('link', {
      name: portugueseNames[I18N_TEST.english],
    });
    const cookie = vi.spyOn(document, 'cookie', 'set');

    expect(english).toHaveAttribute('href', `/jobs?${COUNTRY_QUERY}`);
    expect(
      languages.getByRole('link', {
        name: portugueseNames[I18N_TEST.portuguese],
      }),
    ).toHaveAttribute('href', `${PORTUGUESE_JOBS_PATH}?${COUNTRY_QUERY}`);
    fireEvent.click(english);
    expect(cookie).toHaveBeenCalledWith(
      `${I18N_TEST.cookieName}=${I18N_TEST.english}; path=/; max-age=31536000; SameSite=Lax`,
    );
  });

  it.each([I18N_TEST.english, I18N_TEST.portuguese] as const)(
    'shows new jobs from the last ingest under the header in %s',
    async (locale) => {
      render(await layoutFor(locale), { container: document });

      expect(
        screen.getByText(
          messagesFor(locale).home.newJobs(LATEST_INGEST_NEW_JOBS),
        ),
      ).toBeInTheDocument();
      expect(getLatestIngestNewJobs).toHaveBeenCalled();
    },
  );

  it('answers not found for an unsupported locale segment', async () => {
    await expect(layoutFor(I18N_TEST.invalidLocale)).rejects.toThrow(NOT_FOUND);
    expect(notFound).toHaveBeenCalledOnce();
  });

  it('renders the global error in the language of the failing URL', () => {
    vi.mocked(usePathname).mockReturnValue(PORTUGUESE_JOBS_PATH);
    const retry = vi.fn();
    render(<GlobalError error={I18N_TEST.error} retry={retry} />, {
      container: document,
    });

    expect(
      screen.getByRole('heading', { name: I18N_TEST.portugueseError }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: I18N_TEST.portugueseAbout }),
    ).toHaveAttribute('href', '/pt-BR/about');
    expect(document.documentElement.lang).toBe(I18N_TEST.portuguese);
    fireEvent.click(
      screen.getByRole('button', {
        name: messagesFor(I18N_TEST.portuguese).globalError.retry,
      }),
    );
    expect(retry).toHaveBeenCalledOnce();
  });
});

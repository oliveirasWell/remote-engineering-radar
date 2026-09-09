// @vitest-environment jsdom

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { CompanySummary } from '@/components/report/CompanySummary/CompanySummary';
import { TEST_REPORT_COMPANY } from '@/components/report/test-fixtures';
import { HOME_SECTIONS } from './home-constants';
import { I18N_TEST } from './i18n-fixtures';
import RootLayout from './layout';
import GlobalError from './global-error';
import { messagesFor } from '@/lib/i18n/messages';

vi.mock('next/font/google', () => ({ Geist: () => ({ variable: '' }) }));
vi.mock('@/components/observability/GoogleAnalytics/GoogleAnalytics', () => ({
  GoogleAnalytics: () => null,
}));
vi.mock('@sentry/nextjs', () => ({ captureException: vi.fn() }));

const content = <CompanySummary company={TEST_REPORT_COMPANY} />;

afterEach(() => {
  cleanup();
  document.cookie = `${I18N_TEST.cookieName}=; path=/; max-age=0`;
  document.documentElement.lang = I18N_TEST.english;
  vi.restoreAllMocks();
});

describe('site language and navigation', () => {
  it('shares an About button, language picker, and safe repository footer', () => {
    render(<RootLayout>{content}</RootLayout>, { container: document });

    const header = within(screen.getByRole('banner'));
    expect(header.getByRole('link', { name: I18N_TEST.about })).toHaveAttribute(
      'href',
      '/about',
    );
    expect(
      header.getByRole('combobox', { name: I18N_TEST.language }),
    ).toHaveValue(I18N_TEST.english);
    const github = within(screen.getByRole('contentinfo')).getByRole('link', {
      name: I18N_TEST.github,
    });
    expect(github).toHaveAttribute('href', I18N_TEST.repositoryUrl);
    expect(github).toHaveAttribute('target', '_blank');
    expect(github).toHaveAttribute('rel', 'noreferrer');
  });

  it('switches copy and html language and persists exactly the requested cookie attributes', () => {
    render(<RootLayout>{content}</RootLayout>, { container: document });
    const cookie = vi.spyOn(document, 'cookie', 'set');
    fireEvent.change(
      screen.getByRole('combobox', { name: I18N_TEST.language }),
      {
        target: { value: I18N_TEST.portuguese },
      },
    );

    expect(cookie).toHaveBeenCalledWith(
      `${I18N_TEST.cookieName}=${I18N_TEST.portuguese}; path=/; max-age=31536000; SameSite=Lax`,
    );
    expect(document.documentElement.lang).toBe(I18N_TEST.portuguese);
    expect(screen.getByText(I18N_TEST.portugueseOpenRoles)).toBeInTheDocument();
    expect(screen.getByText(TEST_REPORT_COMPANY.name)).toBeInTheDocument();

    cleanup();
    render(<RootLayout>{content}</RootLayout>, { container: document });
    expect(screen.getByText(I18N_TEST.portugueseOpenRoles)).toBeInTheDocument();
    fireEvent.change(
      screen.getByRole('combobox', { name: I18N_TEST.portugueseLanguage }),
      {
        target: { value: I18N_TEST.english },
      },
    );
    expect(document.documentElement.lang).toBe(I18N_TEST.english);
    expect(
      screen.getByText(
        HOME_SECTIONS.openRoles(TEST_REPORT_COMPANY.openEngineeringJobs),
      ),
    ).toBeInTheDocument();
  });

  it('renders English on the server even with a browser cookie, then restores Portuguese on mount', () => {
    document.cookie = `${I18N_TEST.cookieName}=${I18N_TEST.portuguese}; path=/`;
    const html = renderToString(<RootLayout>{content}</RootLayout>);
    expect(html).toContain(
      HOME_SECTIONS.openRoles(TEST_REPORT_COMPANY.openEngineeringJobs),
    );
    expect(html).not.toContain(I18N_TEST.portugueseOpenRoles);

    render(<RootLayout>{content}</RootLayout>, { container: document });
    expect(screen.getByText(I18N_TEST.portugueseOpenRoles)).toBeInTheDocument();
    expect(document.documentElement.lang).toBe(I18N_TEST.portuguese);
  });

  it('ignores unsupported cookie locales', () => {
    document.cookie = `${I18N_TEST.cookieName}=${I18N_TEST.invalidLocale}; path=/`;
    render(<RootLayout>{content}</RootLayout>, { container: document });
    expect(
      screen.getByText(
        HOME_SECTIONS.openRoles(TEST_REPORT_COMPANY.openEngineeringJobs),
      ),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe(I18N_TEST.english);
  });

  it('hydrates the English document before restoring the cookie without a mismatch', async () => {
    document.cookie = `${I18N_TEST.cookieName}=${I18N_TEST.portuguese}; path=/`;
    const html = new DOMParser().parseFromString(
      renderToString(<RootLayout>{content}</RootLayout>),
      'text/html',
    );
    document.body.innerHTML = html.body.innerHTML;
    document.documentElement.className = html.documentElement.className;
    const onRecoverableError = vi.fn();
    let root: ReturnType<typeof hydrateRoot>;
    await act(async () => {
      root = hydrateRoot(document, <RootLayout>{content}</RootLayout>, {
        onRecoverableError,
      });
    });
    try {
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(
        screen.getByText(I18N_TEST.portugueseOpenRoles),
      ).toBeInTheDocument();
      expect(document.documentElement.lang).toBe(I18N_TEST.portuguese);
    } finally {
      act(() => root.unmount());
    }
  });

  it('restores translation independently when the global error replaces the layout', () => {
    document.cookie = `${I18N_TEST.cookieName}=${I18N_TEST.portuguese}; path=/`;
    const reset = vi.fn();
    render(<GlobalError error={I18N_TEST.error} reset={reset} />, {
      container: document,
    });
    expect(
      screen.getByRole('heading', { name: I18N_TEST.portugueseError }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: I18N_TEST.portugueseAbout }),
    ).toHaveAttribute('href', '/about');
    expect(document.documentElement.lang).toBe(I18N_TEST.portuguese);
    fireEvent.click(
      screen.getByRole('button', {
        name: messagesFor(I18N_TEST.portuguese).globalError.retry,
      }),
    );
    expect(reset).toHaveBeenCalledOnce();
  });
});

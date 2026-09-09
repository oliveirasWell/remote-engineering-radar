// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALES, LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { REPOSITORY_URL } from '@/components/site/constants';
import AboutPage from './page';

vi.mock('@/lib/db/client', () => {
  throw new Error('The static About route must not import the database');
});

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('AboutPage', () => {
  it('prerenders its content in English without accessing the database', () => {
    expect(renderToString(<AboutPage />)).toContain(
      messagesFor().about.sources,
    );
  });

  it.each(LOCALES)(
    'explains sources, freshness, scope, scoring, and applications in %s',
    (locale) => {
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/`;
      const { about, navigation } = messagesFor(locale);
      render(
        <I18nProvider>
          <AboutPage />
        </I18nProvider>,
      );
      expect(
        screen.getByRole('heading', { name: about.title }),
      ).toBeInTheDocument();
      for (const copy of [
        about.introduction,
        about.sources,
        about.freshness,
        about.scope,
        about.scoring,
        about.applications,
        about.repository,
      ]) {
        expect(screen.getByText(copy)).toBeInTheDocument();
      }
      const link = screen.getByRole('link', { name: navigation.github });
      expect(link).toHaveAttribute('href', REPOSITORY_URL);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noreferrer');
    },
  );
});

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALES, LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import {
  CONTACT_EMAIL,
  PERSONAL_SITE_URL,
  REPOSITORY_URL,
} from '@/components/site/constants';
import AboutPage from './page';

vi.mock('@/lib/db/client', () => {
  throw new Error('The static About route must not import the database');
});

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('AboutPage', () => {
  it('prerenders its content in English without accessing the database', () => {
    const html = renderToString(<AboutPage />);
    expect(html).toContain(messagesFor().about.sourcesIntro);
    expect(html).toContain(CONTACT_EMAIL);
  });

  it.each(LOCALES)(
    'explains sources, heuristics, contact, and repository in %s',
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
        about.sourcesIntro,
        about.freshness,
        about.scope,
        about.scoring,
        about.scoringJob,
        about.scoringCompany,
        about.applications,
        about.contact,
        about.repository,
      ]) {
        expect(screen.getByText(copy)).toBeInTheDocument();
      }
      for (const source of about.sources) {
        expect(screen.getByText(source.name)).toBeInTheDocument();
        expect(screen.getByText(`— ${source.description}`)).toBeInTheDocument();
      }
      expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
        'href',
        `mailto:${CONTACT_EMAIL}`,
      );
      expect(
        screen.getByRole('link', { name: PERSONAL_SITE_URL }),
      ).toHaveAttribute('href', PERSONAL_SITE_URL);
      const github = screen.getByRole('link', { name: navigation.github });
      expect(github).toHaveAttribute('href', REPOSITORY_URL);
      expect(github).toHaveAttribute('target', '_blank');
      expect(github).toHaveAttribute('rel', 'noreferrer');
    },
  );
});

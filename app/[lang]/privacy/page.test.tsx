// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { GA_MEASUREMENT_ID } from '@/components/observability/GoogleAnalytics/constants';
import { CONTACT_EMAIL } from '@/components/site/constants';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { editorialFor } from '@/lib/i18n/editorial';
import { LOCALE_COOKIE, LOCALES, messagesFor } from '@/lib/i18n/messages';
import {
  ADSENSE_CLIENT_ID,
  GOOGLE_AD_COOKIES_URL,
  GOOGLE_ADS_SETTINGS_URL,
} from '@/lib/marketing/adsense';
import PrivacyPage, { generateMetadata } from './page';

vi.mock('@/lib/db/client', () => {
  throw new Error('The static privacy route must not import the database');
});

describe('PrivacyPage', () => {
  it.each(LOCALES)(
    'discloses cookies, advertising, analytics, and contact in %s',
    (locale) => {
      const { privacy } = editorialFor(locale);
      render(
        <I18nProvider locale={locale}>
          <PrivacyPage />
        </I18nProvider>,
      );

      expect(
        screen.getByRole('heading', { name: privacy.title }),
      ).toBeInTheDocument();
      expect(screen.getByText(privacy.introduction)).toBeInTheDocument();
      for (const section of privacy.sections) {
        expect(
          screen.getByRole('heading', { name: section.title }),
        ).toBeInTheDocument();
        for (const paragraph of section.paragraphs) {
          expect(screen.getByText(paragraph)).toBeInTheDocument();
        }
      }
      expect(screen.getByText(LOCALE_COOKIE)).toBeInTheDocument();
      expect(screen.getByText(ADSENSE_CLIENT_ID)).toBeInTheDocument();
      expect(screen.getByText(GA_MEASUREMENT_ID)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
        'href',
        `mailto:${CONTACT_EMAIL}`,
      );
      expect(
        screen.getByRole('link', { name: privacy.adsSettingsLabel }),
      ).toHaveAttribute('href', GOOGLE_ADS_SETTINGS_URL);
      expect(
        screen.getByRole('link', { name: privacy.adCookiesLabel }),
      ).toHaveAttribute('href', GOOGLE_AD_COOKIES_URL);
    },
  );

  it('publishes an indexable canonical for the privacy policy', async () => {
    const metadata = await generateMetadata({
      params: Promise.resolve({ lang: 'pt-BR' }),
    });

    expect(metadata).toMatchObject({
      title: messagesFor('pt-BR').navigation.privacy,
      description: editorialFor('pt-BR').privacy.introduction,
      alternates: { canonical: '/pt-BR/privacy' },
      robots: { index: true, follow: true },
    });
  });
});

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { CONTACT_EMAIL } from '@/components/site/constants';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { editorialFor } from '@/lib/i18n/editorial';
import { LOCALE_COOKIE, LOCALES, messagesFor } from '@/lib/i18n/messages';
import PrivacyPage, { generateMetadata } from './page';

const TEST_MEASUREMENT_ID = 'G-TESTMEASURE1';

vi.mock('@/lib/db/client', () => {
  throw new Error('The static privacy route must not import the database');
});

describe('PrivacyPage', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', TEST_MEASUREMENT_ID);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

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
      expect(screen.getByText(TEST_MEASUREMENT_ID)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: CONTACT_EMAIL })).toHaveAttribute(
        'href',
        `mailto:${CONTACT_EMAIL}`,
      );
      expect(screen.queryByText(/AdSense/)).not.toBeInTheDocument();
    },
  );

  it('omits the measurement id when analytics is not configured', () => {
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', '');
    const { privacy } = editorialFor('en');
    render(
      <I18nProvider locale="en">
        <PrivacyPage />
      </I18nProvider>,
    );

    expect(
      screen.getByRole('heading', { name: privacy.title }),
    ).toBeInTheDocument();
    expect(screen.queryByText(TEST_MEASUREMENT_ID)).not.toBeInTheDocument();
    expect(screen.queryByText(privacy.analyticsLabel)).not.toBeInTheDocument();
    expect(screen.getByText(LOCALE_COOKIE)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: CONTACT_EMAIL }),
    ).toBeInTheDocument();
  });

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

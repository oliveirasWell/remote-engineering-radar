// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALES, messagesFor } from '@/lib/i18n/messages';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { GUIDE_PATH, PRIVACY_PATH } from '@/lib/seo/constants';
import { SiteFooter } from './SiteFooter';

const PAGE_LINKS = [
  { path: GUIDE_PATH, label: 'guide' },
  { path: '/about', label: 'about' },
  { path: PRIVACY_PATH, label: 'privacy' },
] as const;

describe('SiteFooter', () => {
  it.each(LOCALES)(
    'links the guide, about, and privacy pages in %s',
    (locale) => {
      const { navigation } = messagesFor(locale);
      render(
        <I18nProvider locale={locale}>
          <SiteFooter />
        </I18nProvider>,
      );
      const footer = screen.getByRole('navigation', {
        name: navigation.footer,
      });

      for (const { path, label } of PAGE_LINKS) {
        expect(
          screen.getByRole('link', { name: navigation[label] }),
        ).toHaveAttribute('href', localizedPath(locale, path));
      }
      expect(footer).toContainElement(
        screen.getByRole('link', { name: navigation.privacy }),
      );
    },
  );
});

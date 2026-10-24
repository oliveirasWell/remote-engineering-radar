'use client';

import Link from 'next/link';
import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { GUIDE_PATH, PRIVACY_PATH } from '@/lib/seo/constants';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { CONTACT_EMAIL, PERSONAL_SITE_URL, REPOSITORY_URL } from '../constants';

const FOOTER_LINK = 'text-muted-foreground underline underline-offset-2';

export const SiteFooter = () => {
  const { locale, messages } = useI18n();
  const pages = [
    { href: GUIDE_PATH, label: messages.navigation.guide },
    { href: '/about', label: messages.navigation.about },
    { href: PRIVACY_PATH, label: messages.navigation.privacy },
  ];

  return (
    <footer className="mx-auto flex w-full max-w-3xl flex-col gap-4 border-t border-border px-6 py-6 text-sm">
      <nav
        aria-label={messages.navigation.footer}
        className="flex flex-wrap gap-x-4 gap-y-2"
      >
        {pages.map(({ href, label }) => (
          <Link
            key={href}
            href={localizedPath(locale, href)}
            className={FOOTER_LINK}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {isSafeExternalUrl(REPOSITORY_URL) ? (
          <a
            href={REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className={FOOTER_LINK}
          >
            {messages.navigation.github}
          </a>
        ) : null}
        <a href={`mailto:${CONTACT_EMAIL}`} className={FOOTER_LINK}>
          {messages.about.contactEmailLabel}
        </a>
        {isSafeExternalUrl(PERSONAL_SITE_URL) ? (
          <a
            href={PERSONAL_SITE_URL}
            target="_blank"
            rel="noreferrer"
            className={FOOTER_LINK}
          >
            {messages.about.contactSiteLabel}
          </a>
        ) : null}
      </div>
    </footer>
  );
};

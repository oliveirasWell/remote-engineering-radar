'use client';

import { useI18n } from '@/components/i18n/I18nProvider/I18nProvider';
import { isSafeExternalUrl } from '@/lib/urls/external-url';
import { REPOSITORY_URL } from '../constants';

export const SiteFooter = () => {
  const { messages } = useI18n();

  return (
    <footer className="mx-auto w-full max-w-3xl border-t border-border px-6 py-6 text-sm">
      {isSafeExternalUrl(REPOSITORY_URL) ? (
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground underline underline-offset-2"
        >
          {messages.navigation.github}
        </a>
      ) : null}
    </footer>
  );
};

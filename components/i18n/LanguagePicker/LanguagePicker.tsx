'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  localizedPath,
  unlocalizedPath,
} from '@/lib/i18n/localized-path/localized-path';
import { useI18n } from '../I18nProvider/I18nProvider';
import { LANGUAGE_OPTIONS } from './constants';

/** Links to `sharedPath` in each language. */
export const LanguageLinks = ({ sharedPath }: { sharedPath: string }) => {
  const { locale, messages, rememberLocale } = useI18n();

  return (
    <div
      role="group"
      aria-label={messages.navigation.language}
      className="inline-flex border border-border p-1 text-sm"
    >
      {LANGUAGE_OPTIONS.map(({ value, label }) => (
        <Link
          key={value}
          href={localizedPath(value, sharedPath)}
          hrefLang={value}
          lang={value}
          aria-label={messages.navigation.languages[value]}
          aria-current={locale === value ? 'true' : undefined}
          onClick={() => rememberLocale(value)}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center px-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
            locale === value
              ? 'bg-primary font-semibold text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  );
};

/** Links to the same page and filters in each language. */
export const LanguagePicker = () => {
  const pathname = unlocalizedPath(usePathname() ?? '/');
  const query = useSearchParams()?.toString();
  return (
    <LanguageLinks sharedPath={query ? `${pathname}?${query}` : pathname} />
  );
};

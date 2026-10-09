import type { Metadata } from 'next';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/i18n/messages';

/**
 * Only normalized, substantive filters belong in canonicals. Filtered views
 * are noindex unless the caller decides otherwise. Every page names its own
 * localized URL as canonical and lists each language version.
 */
export const canonicalMetadata = (
  path: string,
  filters: Record<string, string | number | undefined> = {},
  index?: boolean,
  locale: Locale = DEFAULT_LOCALE,
): Metadata => {
  const search = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, String(value)]),
  ).toString();
  const sharedPath = search ? `${path}?${search}` : path;
  return {
    alternates: {
      canonical: localizedPath(locale, sharedPath),
      languages: {
        ...Object.fromEntries(
          LOCALES.map((language) => [
            language,
            localizedPath(language, sharedPath),
          ]),
        ),
        'x-default': localizedPath(DEFAULT_LOCALE, sharedPath),
      },
    },
    robots: { index: index ?? !search, follow: true },
  };
};

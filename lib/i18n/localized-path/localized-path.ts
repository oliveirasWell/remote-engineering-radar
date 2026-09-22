import { DEFAULT_LOCALE, type Locale } from '../messages';

const PREFIXED_LOCALE: Locale = 'pt-BR';
const PREFIX = `/${PREFIXED_LOCALE}`;

/**
 * The public URL of a shared path in a locale. English keeps the unprefixed
 * URLs it always had; Portuguese lives under /pt-BR.
 */
export const localizedPath = (locale: Locale, path: string): string => {
  if (locale === DEFAULT_LOCALE) {
    return path;
  }
  return path === '/' || path.startsWith('/?')
    ? `${PREFIX}${path.slice(1)}`
    : `${PREFIX}${path}`;
};

/** The shared path behind a public URL, whatever its locale. */
export const unlocalizedPath = (path: string): string => {
  if (path === PREFIX) {
    return '/';
  }
  return path.startsWith(`${PREFIX}/`) ? path.slice(PREFIX.length) : path;
};

/** The locale a public URL belongs to. */
export const localeFromPath = (path: string): Locale =>
  unlocalizedPath(path) === path ? DEFAULT_LOCALE : PREFIXED_LOCALE;

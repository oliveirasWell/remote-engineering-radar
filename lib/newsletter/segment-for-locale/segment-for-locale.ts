import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/messages';
import { RESEND_SEGMENT_ID_ENV, newsletterRequiresMessage } from '../constants';

export const SEGMENT_ENV_BY_LOCALE = {
  en: RESEND_SEGMENT_ID_ENV,
  'pt-BR': 'RESEND_SEGMENT_ID_PT_BR',
} as const satisfies Record<Locale, string>;

/** Stored subscription locales drive the digest. Anything else is English. */
export const digestLocale = (value: unknown): Locale =>
  isLocale(value) ? value : DEFAULT_LOCALE;

export const segmentIdForLocale = (locale: Locale): string => {
  const name = SEGMENT_ENV_BY_LOCALE[locale];
  const segmentId = process.env[name]?.trim();
  if (!segmentId) {
    throw new Error(newsletterRequiresMessage([name]));
  }
  return segmentId;
};

/** The other language's segment, when that variable is configured. */
export const otherSegmentId = (locale: Locale): string | null => {
  const other: Locale = locale === 'pt-BR' ? 'en' : 'pt-BR';
  return process.env[SEGMENT_ENV_BY_LOCALE[other]]?.trim() || null;
};

export const configuredSegmentIds = (): string[] => {
  const english = segmentIdForLocale('en');
  const portuguese = process.env[SEGMENT_ENV_BY_LOCALE['pt-BR']]?.trim();
  return portuguese ? [english, portuguese] : [english];
};

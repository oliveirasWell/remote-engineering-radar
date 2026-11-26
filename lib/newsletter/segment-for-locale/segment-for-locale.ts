import { DEFAULT_LOCALE, isLocale, type Locale } from '@/lib/i18n/messages';

export const SEGMENT_ENV_BY_LOCALE = {
  en: 'RESEND_SEGMENT_ID',
  'pt-BR': 'RESEND_SEGMENT_ID_PT_BR',
} as const satisfies Record<Locale, string>;

/** Stored subscription locales drive the digest. Anything else is English. */
export const digestLocale = (value: unknown): Locale =>
  isLocale(value) ? value : DEFAULT_LOCALE;

export const segmentIdForLocale = (locale: Locale): string => {
  const name = SEGMENT_ENV_BY_LOCALE[locale];
  const segmentId = process.env[name]?.trim();
  if (!segmentId) {
    throw new Error(`Newsletter requires ${name}`);
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
  const portuguese = process.env.RESEND_SEGMENT_ID_PT_BR?.trim();
  return portuguese ? [english, portuguese] : [english];
};

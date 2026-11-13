import {
  JOB_COUNTRY_FILTER_OPTIONS,
  JOB_FOCUS_FILTER_OPTIONS,
} from '@/lib/jobs/constants';

const FOCUS = new Set<string>(JOB_FOCUS_FILTER_OPTIONS.map(({ slug }) => slug));
const COUNTRY = new Set<string>(
  JOB_COUNTRY_FILTER_OPTIONS.map(({ slug }) => slug),
);

export type LaneSubscription = {
  email: string;
  focus: string;
  country: string | null;
  locale: 'en' | 'pt-BR';
};

export const validEmail = (value: unknown): value is string => {
  if (typeof value !== 'string' || value.length > 254 || /\s/.test(value)) {
    return false;
  }
  const parts = value.split('@');
  return (
    parts.length === 2 &&
    parts[0].length > 0 &&
    parts[1].split('.').length >= 2 &&
    parts[1].split('.').every(Boolean)
  );
};

export const validSubscription = (
  input: unknown,
): input is LaneSubscription => {
  if (!input || typeof input !== 'object') {
    return false;
  }
  const { email, focus, country, locale } = input as Record<string, unknown>;
  return (
    validEmail(email) &&
    typeof focus === 'string' &&
    FOCUS.has(focus) &&
    (country === null ||
      (typeof country === 'string' && COUNTRY.has(country))) &&
    (locale === 'en' || locale === 'pt-BR')
  );
};

/** Addresses are stored and sent to Resend trimmed and lower-cased. */
export const normalizeEmail = (email: string) => email.trim().toLowerCase();

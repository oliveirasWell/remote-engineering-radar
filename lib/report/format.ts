import { messagesFor, type Locale } from '@/lib/i18n/messages';

export const formatRelativeTime = (
  value: Date | null,
  now = new Date(),
  locale: Locale = 'en',
): string => {
  if (!value) {
    return messagesFor(locale).report.unknownTime;
  }

  const deltaMs = now.getTime() - value.getTime();
  const minutes = Math.max(0, Math.floor(deltaMs / (1000 * 60)));
  const formatter = new Intl.RelativeTimeFormat(locale);
  if (minutes < 60) {
    return formatter.format(-minutes, 'minute');
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    return formatter.format(-hours, 'hour');
  }

  const days = Math.floor(hours / 24);
  return formatter.format(-days, 'day');
};

export const formatUpdatedLabel = (
  updatedAt: Date | null,
  locale: Locale = 'en',
): string =>
  messagesFor(locale).report.updated(
    updatedAt
      ? `${updatedAt.toISOString().replace('T', ' ').slice(0, 16)} UTC`
      : '—',
  );

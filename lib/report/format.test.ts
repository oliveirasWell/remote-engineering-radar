import { formatRelativeTime, formatUpdatedLabel } from './format';
import { LOCALES, messagesFor } from '@/lib/i18n/messages';

const NOW = new Date('2026-09-09T12:00:00Z');
const RELATIVE_CASES = [
  { ageMs: 0, en: '0 minutes ago', 'pt-BR': 'há 0 minuto' },
  { ageMs: 60_000, en: '1 minute ago', 'pt-BR': 'há 1 minuto' },
  { ageMs: 120_000, en: '2 minutes ago', 'pt-BR': 'há 2 minutos' },
  { ageMs: 3_600_000, en: '1 hour ago', 'pt-BR': 'há 1 hora' },
  { ageMs: 7_200_000, en: '2 hours ago', 'pt-BR': 'há 2 horas' },
  { ageMs: 172_800_000, en: '2 days ago', 'pt-BR': 'há 2 dias' },
];

describe.each(LOCALES)('report timestamps in %s', (locale) => {
  it.each(RELATIVE_CASES)('formats an age of $ageMs milliseconds', (entry) => {
    expect(
      formatRelativeTime(new Date(NOW.getTime() - entry.ageMs), NOW, locale),
    ).toBe(entry[locale]);
  });

  it('translates unknown and updated labels while keeping the UTC timestamp', () => {
    const { report } = messagesFor(locale);
    expect(formatRelativeTime(null, NOW, locale)).toBe(report.unknownTime);
    expect(formatUpdatedLabel(null, locale)).toBe(report.updated('—'));
    expect(formatUpdatedLabel(NOW, locale)).toBe(
      report.updated('2026-09-09 12:00 UTC'),
    );
  });
});

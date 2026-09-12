import { formatRelativeTime, formatSalary, formatUpdatedLabel } from './format';
import { LOCALES, messagesFor } from '@/lib/i18n/messages';
import { EMPTY_REPORT_SALARY, SALARY_BOUND_SEPARATOR } from './constants';

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

const USD_80_000 = {
  en: '$80,000',
  'pt-BR': 'US$\u00a080.000',
} as const;
const USD_180_000 = {
  en: '$180,000',
  'pt-BR': 'US$\u00a0180.000',
} as const;
const PLAIN_80_000 = {
  en: '80,000',
  'pt-BR': '80.000',
} as const;
const PLAIN_180_000 = {
  en: '180,000',
  'pt-BR': '180.000',
} as const;

describe.each(LOCALES)('formatSalary in %s', (locale) => {
  const { jobCard } = messagesFor(locale);

  it('formats a both-bounds range', () => {
    expect(
      formatSalary(
        {
          salaryMin: 80_000,
          salaryMax: 180_000,
          salaryCurrency: 'USD',
          salaryPeriod: 'year',
        },
        locale,
      ),
    ).toBe(
      `${USD_80_000[locale]} ${SALARY_BOUND_SEPARATOR} ${USD_180_000[locale]} ${jobCard.salaryPeriodYear}`,
    );
  });

  it('formats a min-only bound', () => {
    expect(
      formatSalary(
        {
          ...EMPTY_REPORT_SALARY,
          salaryMin: 80_000,
          salaryCurrency: 'USD',
          salaryPeriod: 'year',
        },
        locale,
      ),
    ).toBe(
      `${jobCard.salaryFrom(USD_80_000[locale])} ${jobCard.salaryPeriodYear}`,
    );
  });

  it('formats a max-only bound', () => {
    expect(
      formatSalary(
        {
          ...EMPTY_REPORT_SALARY,
          salaryMax: 180_000,
          salaryCurrency: 'USD',
          salaryPeriod: 'year',
        },
        locale,
      ),
    ).toBe(
      `${jobCard.salaryUpTo(USD_180_000[locale])} ${jobCard.salaryPeriodYear}`,
    );
  });

  it('formats a null-currency range without a symbol', () => {
    expect(
      formatSalary(
        {
          salaryMin: 80_000,
          salaryMax: 180_000,
          salaryCurrency: null,
          salaryPeriod: 'year',
        },
        locale,
      ),
    ).toBe(
      `${PLAIN_80_000[locale]} ${SALARY_BOUND_SEPARATOR} ${PLAIN_180_000[locale]} ${jobCard.salaryPeriodYear}`,
    );
  });
});

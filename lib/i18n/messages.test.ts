import { isLocale, LOCALES, messagesFor } from './messages';

const UNSUPPORTED_LOCALES = [undefined, null, '', 'pt', 'PT-BR', 'fr', ['en']];
const OPEN_ROLE_LABELS = [
  { count: 0, en: '0 open roles', 'pt-BR': '0 vagas abertas' },
  { count: 1, en: '1 open role', 'pt-BR': '1 vaga aberta' },
  { count: 2, en: '2 open roles', 'pt-BR': '2 vagas abertas' },
];

describe('locale catalogs', () => {
  it.each(UNSUPPORTED_LOCALES)(
    'rejects unsupported locale input %j',
    (value) => {
      expect(isLocale(value)).toBe(false);
    },
  );

  it.each(LOCALES)('accepts %s and pluralizes open-role counts', (locale) => {
    expect(isLocale(locale)).toBe(true);
    for (const entry of OPEN_ROLE_LABELS) {
      expect(messagesFor(locale).home.openRoles(entry.count)).toBe(
        entry[locale],
      );
    }
  });
});

import { normalizeCountryName, resolveJobCountries } from './countries';

const INHERITED_COUNTRY_NAMES = ['constructor', '__proto__'] as const;

describe('normalizeCountryName', () => {
  it.each(INHERITED_COUNTRY_NAMES)(
    'normalizes %s as text rather than returning an inherited value',
    (country) => {
      expect(normalizeCountryName(`  ${country.toUpperCase()}  `)).toBe(
        country,
      );
    },
  );

  it('normalizes common country names', () => {
    expect(normalizeCountryName('Brazil')).toBe('brazil');
    expect(normalizeCountryName('Brasil')).toBe('brazil');
    expect(normalizeCountryName('United States')).toBe('united-states');
    expect(normalizeCountryName('Remote')).toBeUndefined();
  });
});

describe('resolveJobCountries', () => {
  it('keeps inherited property names as country strings from both inputs', () => {
    expect(
      resolveJobCountries({
        sourceCountries: [...INHERITED_COUNTRY_NAMES],
        location: INHERITED_COUNTRY_NAMES.join(', '),
        geographies: [],
      }),
    ).toEqual(INHERITED_COUNTRY_NAMES);
  });

  it('merges source countries, location, and geographies', () => {
    expect(
      resolveJobCountries({
        sourceCountries: ['Brazil'],
        location: 'Remote - Chile',
        geographies: ['worldwide'],
      }),
    ).toEqual(expect.arrayContaining(['brazil', 'chile', 'worldwide']));
  });
});

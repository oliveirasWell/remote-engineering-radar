import { normalizeCountryName, resolveJobCountries } from './countries';

const INHERITED_COUNTRY_NAMES = ['constructor', '__proto__'] as const;
const LOCALIZED_COUNTRY_LOCATIONS = [
  {
    sourceCountries: ['Ukraine', 'UA', 'UKR'],
    location: 'Remote - Ucrânia',
    country: 'ukraine',
  },
  {
    sourceCountries: ['India', 'IN', 'IND'],
    location: 'Remote - India',
    country: 'india',
  },
  {
    sourceCountries: ['Egypt', 'EG', 'EGY'],
    location: 'Remote - Egito',
    country: 'egypt',
  },
] as const;

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
  it.each(LOCALIZED_COUNTRY_LOCATIONS)(
    'combines $country country codes and localized locations into one country',
    ({ sourceCountries, location, country }) => {
      expect(
        resolveJobCountries({
          sourceCountries: [...sourceCountries],
          location,
          geographies: [],
        }),
      ).toEqual([country]);
    },
  );

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

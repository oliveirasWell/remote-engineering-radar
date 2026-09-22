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
  {
    sourceCountries: ['Pakistan', 'PK', 'PAK'],
    location: 'Remote - Paquistão',
    country: 'pakistan',
  },
] as const;
const LATAM_LOCATIONS = [
  'LATAM',
  'Latin America',
  'América Latina',
  'Remote - LatAm',
] as const;
const LATAM_REGION = 'latam';
const WORLDWIDE_LOCATION = 'Anywhere';
const WORLDWIDE_REGION = 'worldwide';

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
  it.each(LATAM_LOCATIONS)('resolves %s as the LATAM region', (location) => {
    expect(resolveJobCountries({ location })).toEqual([LATAM_REGION]);
  });

  it('resolves an explicit anywhere location as worldwide', () => {
    expect(resolveJobCountries({ location: WORLDWIDE_LOCATION })).toEqual([
      WORLDWIDE_REGION,
    ]);
  });

  it.each(LOCALIZED_COUNTRY_LOCATIONS)(
    'combines $country country codes and localized locations into one country',
    ({ sourceCountries, location, country }) => {
      expect(
        resolveJobCountries({
          sourceCountries: [...sourceCountries],
          location,
        }),
      ).toEqual([country]);
    },
  );

  it('keeps inherited property names as country strings from both inputs', () => {
    expect(
      resolveJobCountries({
        sourceCountries: [...INHERITED_COUNTRY_NAMES],
        location: INHERITED_COUNTRY_NAMES.join(', '),
      }),
    ).toEqual(INHERITED_COUNTRY_NAMES);
  });

  it('merges source countries and location', () => {
    expect(
      resolveJobCountries({
        sourceCountries: ['Brazil'],
        location: 'Remote - Chile',
      }),
    ).toEqual(['brazil', 'chile']);
  });
});

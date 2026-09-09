import { normalizeCountryName, resolveJobCountries } from './countries';

describe('normalizeCountryName', () => {
  it('normalizes common country names', () => {
    expect(normalizeCountryName('Brazil')).toBe('brazil');
    expect(normalizeCountryName('Brasil')).toBe('brazil');
    expect(normalizeCountryName('United States')).toBe('united-states');
    expect(normalizeCountryName('Remote')).toBeUndefined();
  });
});

describe('resolveJobCountries', () => {
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

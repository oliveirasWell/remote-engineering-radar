import { parseSalaryRange } from './parse-salary-range';

const USD_RANGE = {
  min: 80_000,
  max: 180_000,
  currency: 'USD',
  period: 'year',
} as const;

describe('parseSalaryRange', () => {
  it('parses a dollar K-range as USD', () => {
    expect(parseSalaryRange('$80K - $180K')).toEqual(USD_RANGE);
  });

  it('reads a trailing currency code', () => {
    expect(parseSalaryRange('$150K - $180K CAD')).toEqual({
      min: 150_000,
      max: 180_000,
      currency: 'CAD',
      period: 'year',
    });
  });

  it('accepts full amounts and an en-dash separator', () => {
    expect(parseSalaryRange('$100,000 – $150,000')).toEqual({
      min: 100_000,
      max: 150_000,
      currency: 'USD',
      period: 'year',
    });
  });

  it('returns null for empty, single-value, and malformed ranges', () => {
    expect(parseSalaryRange('')).toBeNull();
    expect(parseSalaryRange('$80K')).toBeNull();
    expect(parseSalaryRange('$80K - $180K plus equity')).toBeNull();
  });
});

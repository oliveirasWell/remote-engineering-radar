import { normalizeJobSalary } from './normalize-salary';

describe('normalizeJobSalary', () => {
  it('drops a salary when min is greater than max', () => {
    expect(
      normalizeJobSalary({
        min: 180000,
        max: 80000,
        currency: 'USD',
        period: 'annual',
      }),
    ).toBeUndefined();
  });

  it('keeps amounts and nulls a currency that is not ISO 4217', () => {
    expect(
      normalizeJobSalary({
        min: 80000,
        max: 180000,
        currency: 'US',
        period: 'yearly',
      }),
    ).toEqual({
      min: 80000,
      max: 180000,
      currency: null,
      period: 'year',
    });
  });

  it('keeps a single bound and defaults an unknown period to year', () => {
    expect(
      normalizeJobSalary({
        min: 80000,
        currency: 'usd',
        period: 'quarterly',
      }),
    ).toEqual({
      min: 80000,
      max: null,
      currency: 'USD',
      period: 'year',
    });
  });

  it('treats zero, empty, and non-integer amounts as absent', () => {
    expect(
      normalizeJobSalary({
        min: 0,
        max: 0,
        currency: '',
        period: '',
      }),
    ).toBeUndefined();
  });
});

import { JOBS_PAGE_LIMIT } from './constants';
import { parseJobFilters } from './parse-job-filters';

describe('parseJobFilters', () => {
  it('drops ambiguous repeated query parameters', () => {
    expect(
      parseJobFilters({
        technology: ['React', 'TypeScript'],
        minimumScore: ['10', '90'],
      }),
    ).toEqual({
      technology: undefined,
      seniority: undefined,
      remote: undefined,
      location: undefined,
      minimumScore: undefined,
      limit: JOBS_PAGE_LIMIT,
    });
  });

  it('keeps single values and rejects an out-of-range score', () => {
    expect(
      parseJobFilters({ technology: ' React ', minimumScore: '900' }),
    ).toMatchObject({ technology: 'React', minimumScore: undefined });
    expect(parseJobFilters({ minimumScore: '90' })).toMatchObject({
      minimumScore: 90,
    });
  });

  it('drops filter values outside the known domain', () => {
    // Every distinct value is a separate `use cache` key and therefore a
    // separate database read, so unknown values must not reach the query.
    expect(
      parseJobFilters({
        technology: 'not-a-tracked-technology',
        seniority: 'wizard',
        remote: 'lunar',
        country: 'atlantis',
      }),
    ).toEqual({
      technology: undefined,
      seniority: undefined,
      remote: undefined,
      country: undefined,
      minimumScore: undefined,
      limit: JOBS_PAGE_LIMIT,
    });
  });

  it('keeps values inside the known domain', () => {
    expect(
      parseJobFilters({
        technology: 'react',
        seniority: 'Senior',
        remote: 'hybrid',
        country: 'Brazil',
      }),
    ).toMatchObject({
      technology: 'React',
      seniority: 'senior',
      remote: 'hybrid',
      country: 'brazil',
    });
  });
});

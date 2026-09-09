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
});

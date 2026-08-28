import { FOCUS_TECHNOLOGIES } from '../constants';
import { JOBS_PAGE_COPY } from './constants';

describe('jobs page copy', () => {
  it('defines filter labels used by the jobs report', () => {
    expect(JOBS_PAGE_COPY.title).toBe('Jobs');
    expect(JOBS_PAGE_COPY.technology).toBe('Technology');
    expect(JOBS_PAGE_COPY.minimumScore).toBe('Minimum score');
    expect(JOBS_PAGE_COPY.notFound).toContain('inactive');
  });

  it('names React and the other focus technologies for SEO visitors', () => {
    for (const technology of FOCUS_TECHNOLOGIES) {
      expect(JOBS_PAGE_COPY.subtitle).toContain(technology);
      expect(JOBS_PAGE_COPY.metaTitle).toContain(technology);
    }
  });
});

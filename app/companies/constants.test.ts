import { COMPANIES_PAGE_COPY } from './constants';

describe('companies page copy', () => {
  it('defines section labels for company hiring evidence', () => {
    expect(COMPANIES_PAGE_COPY.title).toBe('Companies');
    expect(COMPANIES_PAGE_COPY.relevantJobs).toBe('Relevant jobs');
    expect(COMPANIES_PAGE_COPY.evidence).toBe('Evidence / sources');
  });
});

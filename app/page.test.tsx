import { formatUpdatedLabel } from '@/lib/report/format';
import { APP_DESCRIPTION, APP_NAME, FOCUS_TECHNOLOGIES } from './constants';
import { HOME_SECTIONS } from './home-constants';

describe('home report copy', () => {
  it('exposes brand and section titles for the public report', () => {
    expect(APP_NAME).toBe('Remote Engineering Radar');
    expect(HOME_SECTIONS.newOpportunities).toBe('New opportunities');
    expect(HOME_SECTIONS.companiesToWatch).toBe('Companies to watch');
    expect(formatUpdatedLabel(null)).toBe('Updated: —');
  });

  it('names React and the other focus technologies for SEO visitors', () => {
    for (const technology of FOCUS_TECHNOLOGIES) {
      expect(APP_DESCRIPTION).toContain(technology);
      expect(HOME_SECTIONS.subtitle).toContain(technology);
    }
  });
});

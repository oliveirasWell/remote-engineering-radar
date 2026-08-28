import { formatUpdatedLabel } from '@/lib/report/format';
import { APP_NAME } from './constants';
import { HOME_SECTIONS } from './home-constants';

describe('home report copy', () => {
  it('exposes brand and section titles for the public report', () => {
    expect(APP_NAME).toBe('Remote Engineering Radar');
    expect(HOME_SECTIONS.newOpportunities).toBe('New opportunities');
    expect(HOME_SECTIONS.companiesToWatch).toBe('Companies to watch');
    expect(formatUpdatedLabel(null)).toBe('Updated: —');
  });
});

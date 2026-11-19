import { formatSourceMetrics } from './format-source-metrics';

const ROW = {
  source: 'greenhouse',
  runs: 7,
  fetched: 900,
  eligible: 120,
  persisted: 110,
  newJobs: 12,
  medianAgeHours: 30.4,
  activeJobs: 200,
  alsoOnHimalayas: 50,
};

describe('formatSourceMetrics', () => {
  it('renders one row per source with the share not already on Himalayas', () => {
    const table = formatSourceMetrics(
      [ROW, { ...ROW, source: 'himalayas', medianAgeHours: null }],
      7,
    );

    expect(table.split('\n').slice(-2)).toEqual([
      '| greenhouse | 7 | 900 | 120 | 110 | 12 | 30 | 200 | 75% |',
      '| himalayas | 7 | 900 | 120 | 110 | 12 | — | 200 | — |',
    ]);
  });
});

import {
  formatSourceMetrics,
  formatStorageMetrics,
} from './format-source-metrics';

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

  it('summarizes storage in one line', () => {
    expect(
      formatStorageMetrics({
        databaseBytes: 300 * 1024 * 1024,
        activeJobsByWorkModel: { hybrid: 40, remote: 900 },
      }),
    ).toBe('Database 300 MB · active jobs hybrid 40, remote 900');
  });
});

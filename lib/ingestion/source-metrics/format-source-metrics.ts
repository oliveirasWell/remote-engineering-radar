import type { SourceMetricsRow } from './source-metrics-report';

const HEADER = [
  '| Source | Runs | Fetched | Eligible | Kept | New | Median age (h) | Active | Not on Himalayas |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
];

const percent = (part: number, whole: number) =>
  whole === 0 ? '—' : `${Math.round((part / whole) * 100)}%`;

/** A Markdown table for the GitHub Actions job summary. */
export const formatSourceMetrics = (
  rows: readonly SourceMetricsRow[],
  days: number,
): string =>
  [
    `### Sources, last ${days} days (averages per run)`,
    '',
    ...HEADER,
    ...rows
      .map((row) =>
        [
          row.source,
          row.runs,
          row.fetched,
          row.eligible,
          row.persisted,
          row.newJobs,
          row.medianAgeHours === null ? '—' : Math.round(row.medianAgeHours),
          row.activeJobs,
          row.source === 'himalayas'
            ? '—'
            : percent(row.activeJobs - row.alsoOnHimalayas, row.activeJobs),
        ].join(' | '),
      )
      .map((line) => `| ${line} |`),
  ].join('\n');

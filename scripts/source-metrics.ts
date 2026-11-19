import { pathToFileURL } from 'node:url';
import { createDb, disconnectDb } from '../lib/db/client';
import {
  formatSourceMetrics,
  formatStorageMetrics,
} from '../lib/ingestion/source-metrics/format-source-metrics';
import { buildSourceMetricsReport } from '../lib/ingestion/source-metrics/source-metrics-report';
import { readStorageMetrics } from '../lib/ingestion/source-metrics/storage-metrics';

const REPORT_DAYS = 7;

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const db = createDb();
  Promise.all([
    buildSourceMetricsReport(db, { now: new Date(), days: REPORT_DAYS }),
    readStorageMetrics(db),
  ])
    .then(([rows, storage]) =>
      console.log(
        `${formatSourceMetrics(rows, REPORT_DAYS)}\n\n${formatStorageMetrics(storage)}`,
      ),
    )
    .catch((error) => {
      console.error(
        'Source metrics failed:',
        error instanceof Error ? error.message : 'Error',
      );
      process.exitCode = 1;
    })
    .finally(() => disconnectDb(db));
}

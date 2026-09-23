/**
 * Dry-run / audit CLI over reclassifyActiveJobs. Deploy uses the same
 * function via the data-migration runner, not this file.
 *
 *   --dry-run          print counts and write deactivations to --audit, no writes
 *   --audit <file>     where to write the titles that would be deactivated
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { createDb, disconnectDb } from '../lib/db/client';
import { reclassifyActiveJobs } from '../lib/ingestion/reclassify-active-jobs';

const main = async () => {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      audit: { type: 'string' },
    },
  });
  const dryRun = values['dry-run'];
  const db = createDb();

  try {
    const { reclassified, deactivated } = await reclassifyActiveJobs(db, {
      dryRun,
    });
    console.log(
      `${dryRun ? 'Would reclassify' : 'Reclassified'} ${reclassified} rows; ${dryRun ? 'would deactivate' : 'deactivated'} ${deactivated.length}`,
    );
    if (values.audit) {
      await writeFile(values.audit, deactivated.join('\n'));
      console.log(`Deactivation list written to ${values.audit}`);
    }
  } finally {
    await disconnectDb(db);
  }
};

void main();

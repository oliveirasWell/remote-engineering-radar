/**
 * One-off: reclassifies active jobs with the current classifier, so stored
 * rows gain what ingestion would give them today (the software and product
 * tracks, Portuguese vocabulary, title-only seniority words). Rows the
 * classifier now rejects are deactivated, the state ingestion leaves them in.
 * Never touches countries or remote policy. Delete after running.
 *
 *   --dry-run          print counts and write deactivations to --audit, no writes
 *   --audit <file>     where to write the titles that would be deactivated
 */
import { writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { Prisma } from '@prisma/client';
import {
  classifyJob,
  shouldPersistClassifiedJob,
} from '../lib/classification/classify-job';
import { createDb, disconnectDb } from '../lib/db/client';
import { scoreClassifiedJob } from '../lib/scoring/score-job';

const BATCH_SIZE = 1_000;

const main = async () => {
  const { values } = parseArgs({
    options: {
      'dry-run': { type: 'boolean', default: false },
      audit: { type: 'string' },
    },
  });
  const dryRun = values['dry-run'];
  const db = createDb();
  const deactivated: string[] = [];
  let reclassified = 0;
  let cursor: string | undefined;

  try {
    for (;;) {
      const rows = await db.job.findMany({
        where: { isActive: true },
        select: {
          id: true,
          title: true,
          description: true,
          location: true,
          remotePolicy: true,
          seniority: true,
          technologies: true,
        },
        orderBy: { id: 'asc' },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      });
      if (rows.length === 0) {
        break;
      }
      cursor = rows.at(-1)?.id;

      const updates = rows.map((row) => {
        // Same calls as enrichJob in lib/ingestion/run-ingestion.ts.
        const classification = classifyJob({
          title: row.title,
          description: row.description ?? undefined,
          location: row.location ?? undefined,
          remotePolicy: row.remotePolicy ?? undefined,
          technologies: Array.isArray(row.technologies)
            ? row.technologies.filter(
                (tech): tech is string => typeof tech === 'string',
              )
            : [],
        });
        const persist = shouldPersistClassifiedJob(classification);
        if (!persist) {
          deactivated.push(`${row.id} | ${row.title}`);
        }
        return {
          id: row.id,
          technologies: JSON.stringify(classification.technologies),
          seniority: classification.seniority ?? row.seniority,
          roleFocus: JSON.stringify(classification.roleFocus),
          geographies: JSON.stringify(classification.geography),
          score: scoreClassifiedJob(classification, row.seniority ?? undefined)
            .score,
          isActive: persist,
        };
      });
      reclassified += updates.length;

      if (!dryRun) {
        const column = <T>(select: (update: (typeof updates)[number]) => T) =>
          updates.map(select);
        await db.$executeRaw(Prisma.sql`
          UPDATE jobs SET
            technologies = t.technologies::jsonb,
            seniority = t.seniority,
            role_focus = t.role_focus::jsonb,
            geographies = t.geographies::jsonb,
            score = t.score,
            is_active = t.is_active,
            updated_at = now()
          FROM unnest(
            ${column((update) => update.id)}::uuid[],
            ${column((update) => update.technologies)}::text[],
            ${column((update) => update.seniority)}::text[],
            ${column((update) => update.roleFocus)}::text[],
            ${column((update) => update.geographies)}::text[],
            ${column((update) => update.score)}::int[],
            ${column((update) => update.isActive)}::boolean[]
          ) AS t(id, technologies, seniority, role_focus, geographies, score, is_active)
          WHERE jobs.id = t.id
        `);
      }
      console.log(`Processed ${reclassified} rows`);
    }

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

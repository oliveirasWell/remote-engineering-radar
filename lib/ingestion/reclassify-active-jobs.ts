import { Prisma } from '@prisma/client';
import {
  classifyJob,
  shouldPersistClassifiedJob,
} from '@/lib/classification/classify-job';
import type { RootDb } from '@/lib/db/client';
import { scoreClassifiedJob } from '@/lib/scoring/score-job';

export const RECLASSIFY_BATCH_SIZE = 1_000;

export type ReclassifyActiveJobsResult = {
  reclassified: number;
  deactivated: string[];
};

const readTechnologies = (value: Prisma.JsonValue): string[] =>
  Array.isArray(value)
    ? value.filter((tech): tech is string => typeof tech === 'string')
    : [];

export const reclassifyActiveJobs = async (
  db: RootDb,
  options: { dryRun?: boolean } = {},
): Promise<ReclassifyActiveJobsResult> => {
  const dryRun = options.dryRun === true;
  const deactivated: string[] = [];
  let reclassified = 0;
  let cursor: string | undefined;

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
      take: RECLASSIFY_BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (rows.length === 0) {
      break;
    }
    cursor = rows.at(-1)?.id;

    const updates = rows.map((row) => {
      const classification = classifyJob({
        title: row.title,
        description: row.description ?? undefined,
        location: row.location ?? undefined,
        remotePolicy: row.remotePolicy ?? undefined,
        technologies: readTechnologies(row.technologies),
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
  }

  return { reclassified, deactivated };
};

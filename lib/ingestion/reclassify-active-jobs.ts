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
  /** `id | title` of every job the current classifier no longer accepts. */
  deactivated: string[];
};

type JobRow = Awaited<ReturnType<typeof readBatch>>[number];

type JobUpdate = {
  id: string;
  title: string;
  technologies: string;
  seniority: string | null;
  roleFocus: string;
  geographies: string;
  score: number;
  isActive: boolean;
};

const readTechnologies = (value: Prisma.JsonValue): string[] =>
  Array.isArray(value)
    ? value.filter((tech): tech is string => typeof tech === 'string')
    : [];

const readBatch = async (db: RootDb, cursor: string | undefined) =>
  db.job.findMany({
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

/** Same calls as `enrichJob` in run-ingestion.ts, against a stored row. */
const toUpdate = (row: JobRow): JobUpdate => {
  const classification = classifyJob({
    title: row.title,
    description: row.description ?? undefined,
    location: row.location ?? undefined,
    remotePolicy: row.remotePolicy ?? undefined,
    technologies: readTechnologies(row.technologies),
  });

  return {
    id: row.id,
    title: row.title,
    technologies: JSON.stringify(classification.technologies),
    seniority: classification.seniority ?? row.seniority,
    roleFocus: JSON.stringify(classification.roleFocus),
    geographies: JSON.stringify(classification.geography),
    score: scoreClassifiedJob(classification, row.seniority ?? undefined).score,
    isActive: shouldPersistClassifiedJob(classification),
  };
};

const writeUpdates = async (
  db: RootDb,
  updates: readonly JobUpdate[],
): Promise<void> => {
  const column = <T>(select: (update: JobUpdate) => T) => updates.map(select);

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
};

/**
 * One batch per call, recursing on the last id read. Keyset pagination needs
 * the previous page's last row, which is the one thing a plain `map` over the
 * table cannot give us.
 */
const reclassifyFrom = async (
  db: RootDb,
  dryRun: boolean,
  cursor: string | undefined,
  accumulated: ReclassifyActiveJobsResult,
): Promise<ReclassifyActiveJobsResult> => {
  const rows = await readBatch(db, cursor);
  const lastId = rows.at(-1)?.id;
  if (lastId === undefined) {
    return accumulated;
  }

  const updates = rows.map(toUpdate);
  if (!dryRun) {
    await writeUpdates(db, updates);
  }

  return reclassifyFrom(db, dryRun, lastId, {
    reclassified: accumulated.reclassified + updates.length,
    deactivated: [
      ...accumulated.deactivated,
      ...updates
        .filter((update) => !update.isActive)
        .map((update) => `${update.id} | ${update.title}`),
    ],
  });
};

export const reclassifyActiveJobs = (
  db: RootDb,
  options: { dryRun?: boolean } = {},
): Promise<ReclassifyActiveJobsResult> =>
  reclassifyFrom(db, options.dryRun === true, undefined, {
    reclassified: 0,
    deactivated: [],
  });

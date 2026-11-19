import { Prisma } from '@prisma/client';
import type { Db } from '@/lib/db/client';

const HIMALAYAS_SOURCE = 'himalayas';
const DAY_MS = 86_400_000;

export type SourceMetricsRow = {
  source: string;
  runs: number;
  fetched: number;
  eligible: number;
  persisted: number;
  newJobs: number;
  medianAgeHours: number | null;
  activeJobs: number;
  alsoOnHimalayas: number;
};

/** Same title normalization as `deactivateAggregatorTwins`. */
const normalizedTitle = (alias: string) =>
  Prisma.raw(
    `btrim(regexp_replace(lower(${alias}.title), '[^a-z0-9+#.]+', ' ', 'g'))`,
  );

/**
 * Per source: averages over the runs of the last `days`, the stored active
 * jobs, and how many of those Himalayas also lists for the same company and
 * title, which is what the source adds beyond Himalayas.
 */
export const buildSourceMetricsReport = async (
  db: Db,
  { now, days }: { now: Date; days: number },
): Promise<SourceMetricsRow[]> =>
  db.$queryRaw<SourceMetricsRow[]>(Prisma.sql`
    WITH recent AS (
      SELECT
        run.source,
        count(*)::int AS runs,
        round(avg(run.fetched))::int AS fetched,
        round(avg(run.eligible))::int AS eligible,
        round(avg(run.persisted))::int AS persisted,
        round(avg(run.new_jobs))::int AS "newJobs",
        percentile_cont(0.5) WITHIN GROUP (ORDER BY run.median_age_hours)
          AS "medianAgeHours"
      FROM ingestion_source_runs run
      JOIN ingestion_runs ingestion ON ingestion.id = run.run_id
      WHERE ingestion.completed_at >= ${new Date(now.getTime() - days * DAY_MS)}
      GROUP BY run.source
    ),
    active AS (
      SELECT
        job.source,
        count(*)::int AS "activeJobs",
        (count(*) FILTER (
          WHERE job.source <> ${HIMALAYAS_SOURCE} AND EXISTS (
            SELECT 1 FROM jobs twin
            WHERE twin.source = ${HIMALAYAS_SOURCE} AND twin.is_active
              AND twin.company_id = job.company_id
              AND ${normalizedTitle('twin')} = ${normalizedTitle('job')}
          )
        ))::int AS "alsoOnHimalayas"
      FROM jobs job
      WHERE job.is_active
      GROUP BY job.source
    )
    SELECT recent.*,
      coalesce(active."activeJobs", 0) AS "activeJobs",
      coalesce(active."alsoOnHimalayas", 0) AS "alsoOnHimalayas"
    FROM recent
    LEFT JOIN active ON active.source = recent.source
    ORDER BY recent.source
  `);

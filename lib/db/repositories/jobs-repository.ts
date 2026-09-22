import { Prisma, type Job as PrismaJob } from '@prisma/client';
import type { JobGeography } from '@/lib/classification/types';
import {
  JOB_MAX_AGE_MS,
  REMOTE_POLICY_REMOTE,
  type JobCountrySlug,
  type JobFocusSlug,
  type JobSort,
} from '@/lib/jobs/constants';
import type { Job, JobCard, NewJob } from '@/lib/jobs/types';
import type { Db } from '../client';
import { countryFilter } from './country-filter';
import { focusFilter } from './focus-filter';
import { coalescedPostedAtFilter } from './posted-at-filter';
import { JOB_ORDER_BY } from './constants';

const toStringArray = (column: string, value: Prisma.JsonValue): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(
      `Invalid jobs.${column} JSON: expected an array of strings`,
    );
  }

  return [...value];
};

const toGeographies = (value: Prisma.JsonValue): JobGeography[] =>
  toStringArray('geographies', value).filter(
    (entry): entry is JobGeography =>
      entry === 'brazil' ||
      entry === 'latam' ||
      entry === 'americas' ||
      entry === 'worldwide',
  );

/** Every column a list view renders — notably not `description`. */
const jobCardColumns = {
  id: true,
  companyId: true,
  source: true,
  sourceJobId: true,
  title: true,
  url: true,
  location: true,
  remotePolicy: true,
  technologies: true,
  geographies: true,
  countries: true,
  roleFocus: true,
  seniority: true,
  score: true,
  postedAt: true,
  firstSeenAt: true,
  isActive: true,
} as const;

type JobCardRow = Prisma.JobGetPayload<{ select: typeof jobCardColumns }>;

const toJobCard = (row: JobCardRow): JobCard => ({
  ...row,
  technologies: toStringArray('technologies', row.technologies),
  geographies: toGeographies(row.geographies),
  countries: toStringArray('countries', row.countries),
  roleFocus: toStringArray('roleFocus', row.roleFocus),
});

const toJob = (row: PrismaJob): Job => ({
  ...toJobCard(row),
  description: row.description,
  lastSeenAt: row.lastSeenAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

type CompanyJobsOptions = {
  maxAgeMs?: number;
  now?: Date;
  activeOnly?: boolean;
  country?: JobCountrySlug;
  focus?: JobFocusSlug;
};

const companyJobsWhere = (
  companyIds: string[],
  options?: CompanyJobsOptions,
): Prisma.JobWhereInput => {
  const freshness = (): Prisma.JobWhereInput => {
    if (options?.maxAgeMs !== undefined) {
      const now = options.now ?? new Date();
      return {
        isActive: true,
        remotePolicy: REMOTE_POLICY_REMOTE,
        ...coalescedPostedAtFilter(
          'gte',
          new Date(now.getTime() - options.maxAgeMs),
        ),
      };
    }
    return options?.activeOnly ? { isActive: true } : {};
  };

  return {
    companyId: { in: companyIds },
    AND: [
      freshness(),
      countryFilter(options?.country),
      focusFilter(options?.focus),
    ],
  };
};

type RankedJob = {
  id: string;
  companyId: string;
  postedAt: Date | null;
  firstSeenAt: Date;
  score: number;
};

/** Most recently posted first, then the higher score. */
const newestFirst = (left: RankedJob, right: RankedJob): number => {
  const leftMs = (left.postedAt ?? left.firstSeenAt).getTime();
  const rightMs = (right.postedAt ?? right.firstSeenAt).getTime();
  if (rightMs !== leftMs) {
    return rightMs - leftMs;
  }
  return right.score - left.score;
};

const keepPerCompany = (sorted: RankedJob[], limit: number): string[] => {
  const kept = new Map<string, number>();
  return sorted
    .filter((job) => {
      const count = kept.get(job.companyId) ?? 0;
      kept.set(job.companyId, count + 1);
      return count < limit;
    })
    .map((job) => job.id);
};

const escapeLikePattern = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

type ActiveJobsOptions = {
  minimumScore?: number;
  technology?: string;
  seniority?: string;
  remotePolicy?: string;
  country?: JobCountrySlug;
  focus?: JobFocusSlug;
  company?: string;
  location?: string;
  maxAgeMs?: number;
  now?: Date;
};

/** The jobs the site lists; one definition for the list and its count. */
const activeJobsWhere = (options?: ActiveJobsOptions): Prisma.JobWhereInput => {
  const now = options?.now ?? new Date();
  return {
    isActive: true,
    remotePolicy: options?.remotePolicy ?? REMOTE_POLICY_REMOTE,
    ...(options?.minimumScore === undefined
      ? {}
      : { score: { gte: options.minimumScore } }),
    ...(options?.seniority ? { seniority: options.seniority } : {}),
    ...(options?.company ? { company: { slug: options.company } } : {}),
    ...(options?.location
      ? {
          location: {
            contains: escapeLikePattern(options.location),
            mode: 'insensitive' as const,
          },
        }
      : {}),
    ...(options?.technology
      ? { technologies: { array_contains: [options.technology] } }
      : {}),
    AND: [
      countryFilter(options?.country),
      focusFilter(options?.focus),
      options?.maxAgeMs === undefined
        ? {}
        : coalescedPostedAtFilter(
            'gte',
            new Date(now.getTime() - options.maxAgeMs),
          ),
    ],
  };
};

const createData = (
  input: NewJob,
  now: Date,
): Prisma.JobUncheckedCreateInput => ({
  companyId: input.companyId,
  source: input.source,
  sourceJobId: input.sourceJobId,
  title: input.title,
  url: input.url,
  location: input.location ?? null,
  remotePolicy: input.remotePolicy ?? null,
  description: input.description ?? null,
  technologies: input.technologies ?? [],
  geographies: input.geographies ?? [],
  countries: input.countries ?? [],
  roleFocus: input.roleFocus ?? [],
  seniority: input.seniority ?? null,
  score: input.score ?? 0,
  postedAt: input.postedAt ?? null,
  firstSeenAt: input.firstSeenAt ?? now,
  lastSeenAt: input.lastSeenAt ?? now,
  isActive: input.isActive ?? true,
});

export const createJobsRepository = (db: Db) => ({
  create: async (input: NewJob): Promise<Job> =>
    toJob(await db.job.create({ data: createData(input, new Date()) })),

  findById: async (id: string): Promise<Job | null> => {
    const row = await db.job.findUnique({ where: { id } });
    return row ? toJob(row) : null;
  },

  listSitemapJobs: async (now: Date = new Date()): Promise<{ id: string }[]> =>
    db.job.findMany({
      where: {
        isActive: true,
        remotePolicy: REMOTE_POLICY_REMOTE,
        ...coalescedPostedAtFilter(
          'gte',
          new Date(now.getTime() - JOB_MAX_AGE_MS),
        ),
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    }),

  findBySourceJobId: async (
    source: string,
    sourceJobId: string,
  ): Promise<Job | null> => {
    const row = await db.job.findUnique({
      where: { source_sourceJobId: { source, sourceJobId } },
    });
    return row ? toJob(row) : null;
  },

  listByCompanyId: async (companyId: string): Promise<Job[]> =>
    (await db.job.findMany({ where: { companyId } })).map(toJob),

  listCardsByCompanyIds: async (
    companyIds: string[],
    options?: CompanyJobsOptions & { perCompanyLimit?: number },
  ): Promise<JobCard[]> => {
    if (companyIds.length === 0) {
      return [];
    }

    const where = companyJobsWhere(companyIds, options);
    const perCompanyLimit = options?.perCompanyLimit;
    // Prisma cannot take N rows per group, so rank on a few narrow columns
    // first and load full cards only for the rows that are kept.
    const keptIds =
      perCompanyLimit === undefined
        ? undefined
        : keepPerCompany(
            (
              await db.job.findMany({
                where,
                select: {
                  id: true,
                  companyId: true,
                  postedAt: true,
                  firstSeenAt: true,
                  score: true,
                },
              })
            ).sort(newestFirst),
            perCompanyLimit,
          );

    const rows = await db.job.findMany({
      where: keptIds ? { id: { in: keptIds } } : where,
      select: jobCardColumns,
    });

    return rows.map(toJobCard).sort(newestFirst);
  },

  countByCompanyIds: async (
    companyIds: string[],
    options?: CompanyJobsOptions,
  ): Promise<Map<string, number>> => {
    if (companyIds.length === 0) {
      return new Map();
    }

    const groups = await db.job.groupBy({
      by: ['companyId'],
      where: companyJobsWhere(companyIds, options),
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.companyId, group._count._all]));
  },

  listActiveByScore: async (
    options?: ActiveJobsOptions & { limit?: number; sort?: JobSort },
  ): Promise<JobCard[]> => {
    const rows = await db.job.findMany({
      where: activeJobsWhere(options),
      select: jobCardColumns,
      orderBy: JOB_ORDER_BY[options?.sort ?? 'relevance'],
      ...(options?.limit === undefined ? {} : { take: options.limit }),
    });
    return rows.map(toJobCard);
  },

  countActive: async (options?: ActiveJobsOptions): Promise<number> =>
    db.job.count({ where: activeJobsWhere(options) }),

  updateScore: async (id: string, score: number): Promise<Job | null> => {
    const [row] = await db.job.updateManyAndReturn({
      where: { id },
      data: { score, updatedAt: new Date() },
    });
    return row ? toJob(row) : null;
  },

  /**
   * One statement for the whole ingestion batch. A conflict keeps the stored
   * `firstSeenAt`, and keeps the stored `postedAt` when the batch has none:
   * feeds routinely drop that date, and wiping it both stops the job ageing
   * out and sorts it NULLS FIRST. `score` is always written.
   */
  upsertManyBySourceJobId: async (inputs: NewJob[]): Promise<number> => {
    // ON CONFLICT DO UPDATE errors when one statement hits a key twice.
    const rows = [
      ...new Map(
        inputs.map((input) => [
          `${input.source}\u0000${input.sourceJobId}`,
          input,
        ]),
      ).values(),
    ];
    if (rows.length === 0) {
      return 0;
    }

    const now = new Date();
    const column = <T>(select: (input: NewJob) => T): T[] => rows.map(select);

    return db.$executeRaw(Prisma.sql`
      INSERT INTO jobs (
        company_id, source, source_job_id, title, url, location, remote_policy,
        description, technologies, geographies, countries, role_focus, seniority,
        score, posted_at, first_seen_at, last_seen_at, is_active
      )
      SELECT
        company_id, source, source_job_id, title, url, location, remote_policy,
        description, technologies::jsonb, geographies::jsonb, countries::jsonb,
        role_focus::jsonb, seniority, score, posted_at, first_seen_at,
        last_seen_at, is_active
      FROM unnest(
        ${column((row) => row.companyId)}::uuid[],
        ${column((row) => row.source)}::text[],
        ${column((row) => row.sourceJobId)}::text[],
        ${column((row) => row.title)}::text[],
        ${column((row) => row.url)}::text[],
        ${column((row) => row.location ?? null)}::text[],
        ${column((row) => row.remotePolicy ?? null)}::text[],
        ${column((row) => row.description ?? null)}::text[],
        ${column((row) => JSON.stringify(row.technologies ?? []))}::text[],
        ${column((row) => JSON.stringify(row.geographies ?? []))}::text[],
        ${column((row) => JSON.stringify(row.countries ?? []))}::text[],
        ${column((row) => JSON.stringify(row.roleFocus ?? []))}::text[],
        ${column((row) => row.seniority ?? null)}::text[],
        ${column((row) => row.score ?? 0)}::int[],
        ${column((row) => row.postedAt ?? null)}::timestamptz[],
        ${column((row) => row.firstSeenAt ?? now)}::timestamptz[],
        ${column((row) => row.lastSeenAt ?? now)}::timestamptz[],
        ${column((row) => row.isActive ?? true)}::boolean[]
      ) AS t(
        company_id, source, source_job_id, title, url, location, remote_policy,
        description, technologies, geographies, countries, role_focus, seniority,
        score, posted_at, first_seen_at, last_seen_at, is_active
      )
      ON CONFLICT (source, source_job_id) DO UPDATE SET
        company_id = EXCLUDED.company_id,
        title = EXCLUDED.title,
        url = EXCLUDED.url,
        location = EXCLUDED.location,
        remote_policy = EXCLUDED.remote_policy,
        description = EXCLUDED.description,
        technologies = EXCLUDED.technologies,
        geographies = EXCLUDED.geographies,
        countries = EXCLUDED.countries,
        role_focus = EXCLUDED.role_focus,
        seniority = EXCLUDED.seniority,
        score = EXCLUDED.score,
        posted_at = COALESCE(EXCLUDED.posted_at, jobs.posted_at),
        last_seen_at = EXCLUDED.last_seen_at,
        is_active = EXCLUDED.is_active,
        updated_at = ${now}
    `);
  },

  deactivateMissingBySource: async (
    source: string,
    sourceJobIds: string[],
  ): Promise<{ companyId: string }[]> =>
    db.job.updateManyAndReturn({
      where: {
        source,
        isActive: true,
        ...(sourceJobIds.length === 0
          ? {}
          : { sourceJobId: { notIn: sourceJobIds } }),
      },
      data: { isActive: false, updatedAt: new Date() },
      select: { companyId: true },
    }),

  deactivateBySourceJobIds: async (
    source: string,
    sourceJobIds: string[],
  ): Promise<{ companyId: string }[]> => {
    if (sourceJobIds.length === 0) {
      return [];
    }
    return db.job.updateManyAndReturn({
      where: { source, sourceJobId: { in: sourceJobIds }, isActive: true },
      data: { isActive: false, updatedAt: new Date() },
      select: { companyId: true },
    });
  },

  deactivateOlderThan: async (
    maxAgeMs: number,
    now: Date = new Date(),
  ): Promise<{ companyId: string }[]> =>
    db.job.updateManyAndReturn({
      where: {
        isActive: true,
        ...coalescedPostedAtFilter('lt', new Date(now.getTime() - maxAgeMs)),
      },
      data: { isActive: false, updatedAt: now },
      select: { companyId: true },
    }),

  /** Rows are only ever deactivated, so without this the table grows forever. */
  deleteInactiveOlderThan: async (
    retentionMs: number,
    now: Date = new Date(),
  ): Promise<number> =>
    (
      await db.job.deleteMany({
        where: {
          isActive: false,
          ...coalescedPostedAtFilter(
            'lt',
            new Date(now.getTime() - retentionMs),
          ),
        },
      })
    ).count,

  deactivate: async (id: string): Promise<Job | null> => {
    const [row] = await db.job.updateManyAndReturn({
      where: { id },
      data: { isActive: false, updatedAt: new Date() },
    });
    return row ? toJob(row) : null;
  },

  deleteById: async (id: string): Promise<boolean> =>
    (await db.job.deleteMany({ where: { id } })).count > 0,
});

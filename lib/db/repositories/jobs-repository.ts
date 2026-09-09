import { Prisma, type Job as PrismaJob } from '@prisma/client';
import type { JobGeography } from '@/lib/classification/types';
import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import type { Job, JobCard, NewJob } from '@/lib/jobs/types';
import type { Db } from '../client';
import { coalescedPostedAtFilter } from './posted-at-filter';

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
});

const toJob = (row: PrismaJob): Job => ({
  ...toJobCard(row),
  description: row.description,
  lastSeenAt: row.lastSeenAt,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const escapeLikePattern = (value: string): string =>
  value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

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
    options?: { maxAgeMs?: number; now?: Date; activeOnly?: boolean },
  ): Promise<JobCard[]> => {
    if (companyIds.length === 0) {
      return [];
    }

    const freshnessFilter = (): Prisma.JobWhereInput => {
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

    const rows = await db.job.findMany({
      where: { companyId: { in: companyIds }, ...freshnessFilter() },
      select: jobCardColumns,
      orderBy: [{ score: 'desc' }, { postedAt: 'desc' }],
    });
    return rows.map(toJobCard);
  },

  listActiveByScore: async (options?: {
    limit?: number;
    minimumScore?: number;
    technology?: string;
    seniority?: string;
    remotePolicy?: string;
    country?: string;
    location?: string;
    maxAgeMs?: number;
    now?: Date;
  }): Promise<JobCard[]> => {
    const now = options?.now ?? new Date();
    const rows = await db.job.findMany({
      where: {
        isActive: true,
        remotePolicy: options?.remotePolicy ?? REMOTE_POLICY_REMOTE,
        ...(options?.minimumScore === undefined
          ? {}
          : { score: { gte: options.minimumScore } }),
        ...(options?.seniority ? { seniority: options.seniority } : {}),
        ...(options?.country
          ? { countries: { array_contains: [options.country] } }
          : {}),
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
        ...(options?.maxAgeMs === undefined
          ? {}
          : coalescedPostedAtFilter(
              'gte',
              new Date(now.getTime() - options.maxAgeMs),
            )),
      },
      select: jobCardColumns,
      orderBy: [{ score: 'desc' }, { postedAt: 'desc' }],
      ...(options?.limit === undefined ? {} : { take: options.limit }),
    });
    return rows.map(toJobCard);
  },

  updateScore: async (id: string, score: number): Promise<Job | null> => {
    const [row] = await db.job.updateManyAndReturn({
      where: { id },
      data: { score, updatedAt: new Date() },
    });
    return row ? toJob(row) : null;
  },

  upsertBySourceJobId: async (input: NewJob): Promise<{ id: string }> => {
    const now = new Date();
    return db.job.upsert({
      where: {
        source_sourceJobId: {
          source: input.source,
          sourceJobId: input.sourceJobId,
        },
      },
      create: createData(input, now),
      update: {
        companyId: input.companyId,
        title: input.title,
        url: input.url,
        location: input.location ?? null,
        remotePolicy: input.remotePolicy ?? null,
        description: input.description ?? null,
        technologies: input.technologies ?? [],
        geographies: input.geographies ?? [],
        countries: input.countries ?? [],
        seniority: input.seniority ?? null,
        ...(input.score === undefined ? {} : { score: input.score }),
        ...(input.postedAt === undefined ? {} : { postedAt: input.postedAt }),
        lastSeenAt: now,
        isActive: input.isActive ?? true,
        updatedAt: now,
      },
      select: { id: true },
    });
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

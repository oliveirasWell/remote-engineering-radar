import { Prisma, type Job as PrismaJob } from '@prisma/client';
import type { Job, NewJob } from '@/lib/jobs/types';
import type { Db } from '../client';

const toTechnologies = (value: Prisma.JsonValue): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === 'string')
  ) {
    throw new Error(
      'Invalid jobs.technologies JSON: expected an array of strings',
    );
  }

  return [...value];
};

const toJob = (row: PrismaJob): Job => ({
  id: row.id,
  companyId: row.companyId,
  source: row.source,
  sourceJobId: row.sourceJobId,
  title: row.title,
  url: row.url,
  location: row.location,
  remotePolicy: row.remotePolicy,
  description: row.description,
  technologies: toTechnologies(row.technologies),
  seniority: row.seniority,
  score: row.score,
  postedAt: row.postedAt,
  firstSeenAt: row.firstSeenAt,
  lastSeenAt: row.lastSeenAt,
  isActive: row.isActive,
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

  listActiveByScore: async (options?: {
    limit?: number;
    minimumScore?: number;
    technology?: string;
    seniority?: string;
    remotePolicy?: string;
    location?: string;
  }): Promise<Job[]> => {
    const rows = await db.job.findMany({
      where: {
        isActive: true,
        ...(options?.minimumScore === undefined
          ? {}
          : { score: { gte: options.minimumScore } }),
        ...(options?.seniority ? { seniority: options.seniority } : {}),
        ...(options?.remotePolicy
          ? { remotePolicy: options.remotePolicy }
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
      },
      orderBy: [{ score: 'desc' }, { postedAt: 'desc' }],
      ...(options?.limit === undefined ? {} : { take: options.limit }),
    });
    return rows.map(toJob);
  },

  updateScore: async (id: string, score: number): Promise<Job | null> => {
    const [row] = await db.job.updateManyAndReturn({
      where: { id },
      data: { score, updatedAt: new Date() },
    });
    return row ? toJob(row) : null;
  },

  upsertBySourceJobId: async (input: NewJob): Promise<Job> => {
    const now = new Date();
    return toJob(
      await db.job.upsert({
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
          seniority: input.seniority ?? null,
          ...(input.score === undefined ? {} : { score: input.score }),
          ...(input.postedAt === undefined ? {} : { postedAt: input.postedAt }),
          lastSeenAt: now,
          isActive: input.isActive ?? true,
          updatedAt: now,
        },
      }),
    );
  },

  deactivateMissingBySource: async (
    source: string,
    sourceJobIds: string[],
  ): Promise<Job[]> =>
    (
      await db.job.updateManyAndReturn({
        where: {
          source,
          isActive: true,
          ...(sourceJobIds.length === 0
            ? {}
            : { sourceJobId: { notIn: sourceJobIds } }),
        },
        data: { isActive: false, updatedAt: new Date() },
      })
    ).map(toJob),

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

import type { Prisma, Company as PrismaCompany } from '@prisma/client';
import {
  DEFAULT_COMPANY_KIND,
  resolveCompanyKind,
  type CompanyKind,
} from '@/lib/companies/constants';
import type { Company, NewCompany } from '@/lib/companies/types';
import { REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import type { Db } from '../client';

const toCompanyKind = (value: string): CompanyKind => {
  if (value === 'consultancy' || value === 'staffing' || value === 'product') {
    return value;
  }
  return DEFAULT_COMPANY_KIND;
};

const toCompany = (row: PrismaCompany): Company => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  websiteUrl: row.websiteUrl,
  logoUrl: row.logoUrl,
  source: row.source,
  kind: toCompanyKind(row.kind),
  hiringScore: row.hiringScore,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

const resolveKindForInput = (input: NewCompany): CompanyKind =>
  input.kind ?? resolveCompanyKind(input.slug);

/** Mirrors `coalesce(posted_at, first_seen_at) >= cutoff`. */
const postedSinceFilter = (cutoff: Date): Prisma.JobWhereInput => ({
  OR: [
    { postedAt: { gte: cutoff } },
    { postedAt: null, firstSeenAt: { gte: cutoff } },
  ],
});

export const createCompaniesRepository = (db: Db) => ({
  create: async (input: NewCompany): Promise<Company> =>
    toCompany(
      await db.company.create({
        data: {
          name: input.name,
          slug: input.slug,
          websiteUrl: input.websiteUrl ?? null,
          logoUrl: input.logoUrl ?? null,
          source: input.source,
          kind: resolveKindForInput(input),
          hiringScore: input.hiringScore ?? 0,
        },
      }),
    ),

  findById: async (id: string): Promise<Company | null> => {
    const row = await db.company.findUnique({ where: { id } });
    return row ? toCompany(row) : null;
  },

  findBySlug: async (slug: string): Promise<Company | null> => {
    const row = await db.company.findUnique({ where: { slug } });
    return row ? toCompany(row) : null;
  },

  listByIds: async (ids: string[]): Promise<Company[]> => {
    if (ids.length === 0) {
      return [];
    }

    const rows = await db.company.findMany({ where: { id: { in: ids } } });
    return rows.map(toCompany);
  },

  listByHiringScore: async (options?: {
    limit?: number;
    minimumHiringScore?: number;
    country?: string;
    maxJobAgeMs?: number;
    now?: Date;
  }): Promise<Company[]> => {
    const now = options?.now ?? new Date();
    const maxJobAgeMs = options?.maxJobAgeMs;
    const cutoff =
      maxJobAgeMs === undefined
        ? undefined
        : new Date(now.getTime() - maxJobAgeMs);

    const rows = await db.company.findMany({
      where: {
        hiringScore: { gt: options?.minimumHiringScore ?? 0 },
        jobs: {
          some: {
            isActive: true,
            remotePolicy: REMOTE_POLICY_REMOTE,
            ...(cutoff ? postedSinceFilter(cutoff) : {}),
            ...(options?.country
              ? { countries: { array_contains: [options.country] } }
              : {}),
          },
        },
      },
      orderBy: [{ hiringScore: 'desc' }, { updatedAt: 'desc' }],
      ...(options?.limit === undefined ? {} : { take: options.limit }),
    });
    return rows.map(toCompany);
  },

  updateHiringScore: async (
    id: string,
    hiringScore: number,
  ): Promise<Company | null> => {
    const [row] = await db.company.updateManyAndReturn({
      where: { id },
      data: { hiringScore, updatedAt: new Date() },
    });
    return row ? toCompany(row) : null;
  },

  upsertBySlug: async (input: NewCompany): Promise<Company> => {
    const kind = resolveKindForInput(input);
    return toCompany(
      await db.company.upsert({
        where: { slug: input.slug },
        create: {
          name: input.name,
          slug: input.slug,
          websiteUrl: input.websiteUrl ?? null,
          logoUrl: input.logoUrl ?? null,
          source: input.source,
          kind,
          hiringScore: input.hiringScore ?? 0,
        },
        update: {
          name: input.name,
          source: input.source,
          kind,
          ...(input.websiteUrl === undefined
            ? {}
            : { websiteUrl: input.websiteUrl }),
          ...(input.logoUrl === undefined ? {} : { logoUrl: input.logoUrl }),
          ...(input.hiringScore === undefined
            ? {}
            : { hiringScore: input.hiringScore }),
          updatedAt: new Date(),
        },
      }),
    );
  },

  deleteById: async (id: string): Promise<boolean> =>
    (await db.company.deleteMany({ where: { id } })).count > 0,
});

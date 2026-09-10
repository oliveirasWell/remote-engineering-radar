import { Prisma, type Company as PrismaCompany } from '@prisma/client';
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

  /**
   * One statement for the whole ingestion batch. Unlike `upsertBySlug` it
   * cannot clear a field: an absent `websiteUrl`/`logoUrl` is preserved rather
   * than distinguished from an explicit `null`, and `hiringScore` is left alone
   * entirely because the hiring-signal pass owns it.
   */
  upsertManyBySlug: async (
    inputs: NewCompany[],
  ): Promise<{ id: string; slug: string }[]> => {
    // ON CONFLICT DO UPDATE errors when one statement hits a slug twice.
    const rows = [
      ...new Map(inputs.map((input) => [input.slug, input])).values(),
    ];
    if (rows.length === 0) {
      return [];
    }

    return db.$queryRaw<{ id: string; slug: string }[]>(Prisma.sql`
      INSERT INTO companies (name, slug, website_url, logo_url, source, kind, hiring_score)
      SELECT * FROM unnest(
        ${rows.map((row) => row.name)}::text[],
        ${rows.map((row) => row.slug)}::text[],
        ${rows.map((row) => row.websiteUrl ?? null)}::text[],
        ${rows.map((row) => row.logoUrl ?? null)}::text[],
        ${rows.map((row) => row.source)}::text[],
        ${rows.map(resolveKindForInput)}::text[],
        ${rows.map((row) => row.hiringScore ?? 0)}::int[]
      )
      ON CONFLICT (slug) DO UPDATE SET
        name = EXCLUDED.name,
        source = EXCLUDED.source,
        kind = EXCLUDED.kind,
        website_url = COALESCE(EXCLUDED.website_url, companies.website_url),
        logo_url = COALESCE(EXCLUDED.logo_url, companies.logo_url),
        updated_at = ${new Date()}
      RETURNING id, slug
    `);
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

  deleteById: async (id: string): Promise<boolean> =>
    (await db.company.deleteMany({ where: { id } })).count > 0,
});

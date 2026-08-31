import type { Company as PrismaCompany } from '@prisma/client';
import type { Company, NewCompany } from '@/lib/companies/types';
import type { Db } from '../client';

const toCompany = (row: PrismaCompany): Company => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  websiteUrl: row.websiteUrl,
  logoUrl: row.logoUrl,
  source: row.source,
  hiringScore: row.hiringScore,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
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

  listByHiringScore: async (options?: {
    limit?: number;
    minimumHiringScore?: number;
  }): Promise<Company[]> => {
    const rows = await db.company.findMany({
      where: { hiringScore: { gt: options?.minimumHiringScore ?? 0 } },
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

  upsertBySlug: async (input: NewCompany): Promise<Company> =>
    toCompany(
      await db.company.upsert({
        where: { slug: input.slug },
        create: {
          name: input.name,
          slug: input.slug,
          websiteUrl: input.websiteUrl ?? null,
          logoUrl: input.logoUrl ?? null,
          source: input.source,
          hiringScore: input.hiringScore ?? 0,
        },
        update: {
          name: input.name,
          source: input.source,
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
    ),

  deleteById: async (id: string): Promise<boolean> =>
    (await db.company.deleteMany({ where: { id } })).count > 0,
});

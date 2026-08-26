import { desc, eq, gt } from 'drizzle-orm';
import type { Company, NewCompany } from '@/lib/companies/types';
import type { Db } from '../client';
import { companies } from '../schema/companies';

const toCompany = (row: typeof companies.$inferSelect): Company => ({
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
  create: async (input: NewCompany): Promise<Company> => {
    const [row] = await db
      .insert(companies)
      .values({
        name: input.name,
        slug: input.slug,
        websiteUrl: input.websiteUrl ?? null,
        logoUrl: input.logoUrl ?? null,
        source: input.source,
        hiringScore: input.hiringScore ?? 0,
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create company');
    }

    return toCompany(row);
  },

  findById: async (id: string): Promise<Company | null> => {
    const [row] = await db.select().from(companies).where(eq(companies.id, id));
    return row ? toCompany(row) : null;
  },

  findBySlug: async (slug: string): Promise<Company | null> => {
    const [row] = await db
      .select()
      .from(companies)
      .where(eq(companies.slug, slug));
    return row ? toCompany(row) : null;
  },

  listByHiringScore: async (options?: {
    limit?: number;
    minimumHiringScore?: number;
  }): Promise<Company[]> => {
    const minimum = options?.minimumHiringScore ?? 0;
    const query = db
      .select()
      .from(companies)
      .where(gt(companies.hiringScore, minimum))
      .orderBy(desc(companies.hiringScore), desc(companies.updatedAt));

    const rows =
      options?.limit !== undefined
        ? await query.limit(options.limit)
        : await query;
    return rows.map(toCompany);
  },

  updateHiringScore: async (
    id: string,
    hiringScore: number,
  ): Promise<Company | null> => {
    const [row] = await db
      .update(companies)
      .set({ hiringScore, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return row ? toCompany(row) : null;
  },

  deleteById: async (id: string): Promise<boolean> => {
    const deleted = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning();
    return deleted.length > 0;
  },
});

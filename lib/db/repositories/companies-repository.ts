import { and, desc, eq, exists, gt, sql } from 'drizzle-orm';
import {
  DEFAULT_COMPANY_KIND,
  resolveCompanyKind,
  type CompanyKind,
} from '@/lib/companies/constants';
import type { Company, NewCompany } from '@/lib/companies/types';
import type { CompanyMarketFilter } from '@/lib/jobs/constants';
import type { Db } from '../client';
import { companies } from '../schema/companies';
import { jobs } from '../schema/jobs';

const toCompanyKind = (value: string): CompanyKind => {
  if (value === 'consultancy' || value === 'staffing' || value === 'product') {
    return value;
  }
  return DEFAULT_COMPANY_KIND;
};

const toCompany = (row: typeof companies.$inferSelect): Company => ({
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

export const createCompaniesRepository = (db: Db) => {
  const repository = {
    create: async (input: NewCompany): Promise<Company> => {
      const kind = resolveKindForInput(input);
      const [row] = await db
        .insert(companies)
        .values({
          name: input.name,
          slug: input.slug,
          websiteUrl: input.websiteUrl ?? null,
          logoUrl: input.logoUrl ?? null,
          source: input.source,
          kind,
          hiringScore: input.hiringScore ?? 0,
        })
        .returning();

      if (!row) {
        throw new Error('Failed to create company');
      }

      return toCompany(row);
    },

    findById: async (id: string): Promise<Company | null> => {
      const [row] = await db
        .select()
        .from(companies)
        .where(eq(companies.id, id));
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
      market?: CompanyMarketFilter;
      maxJobAgeMs?: number;
      now?: Date;
    }): Promise<Company[]> => {
      const minimum = options?.minimumHiringScore ?? 0;
      const filters = [gt(companies.hiringScore, minimum)];

      if (options?.market === 'brazil') {
        const now = options.now ?? new Date();
        const cutoff =
          options.maxJobAgeMs === undefined
            ? undefined
            : new Date(now.getTime() - options.maxJobAgeMs);

        filters.push(
          exists(
            db
              .select({ id: jobs.id })
              .from(jobs)
              .where(
                and(
                  eq(jobs.companyId, companies.id),
                  eq(jobs.isActive, true),
                  ...(cutoff
                    ? [
                        sql`coalesce(${jobs.postedAt}, ${jobs.firstSeenAt}) >= ${cutoff}`,
                      ]
                    : []),
                  sql`(
                    ${jobs.geographies} @> ${JSON.stringify(['brazil'])}::jsonb
                    OR ${jobs.geographies} @> ${JSON.stringify(['latam'])}::jsonb
                  )`,
                ),
              ),
          ),
        );
      }

      const query = db
        .select()
        .from(companies)
        .where(and(...filters))
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

    upsertBySlug: async (input: NewCompany): Promise<Company> => {
      const kind = resolveKindForInput(input);
      const [row] = await db
        .insert(companies)
        .values({
          name: input.name,
          slug: input.slug,
          websiteUrl: input.websiteUrl ?? null,
          logoUrl: input.logoUrl ?? null,
          source: input.source,
          kind,
          hiringScore: input.hiringScore ?? 0,
        })
        .onConflictDoUpdate({
          target: companies.slug,
          set: {
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
        })
        .returning();

      if (!row) {
        throw new Error('Failed to upsert company');
      }

      return toCompany(row);
    },

    deleteById: async (id: string): Promise<boolean> => {
      const deleted = await db
        .delete(companies)
        .where(eq(companies.id, id))
        .returning();
      return deleted.length > 0;
    },
  };

  return repository;
};

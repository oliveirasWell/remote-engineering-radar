import { eq } from 'drizzle-orm';
import type { HiringSignal, NewHiringSignal } from '@/lib/hiring-signals/types';
import type { Db } from '../client';
import { companies } from '../schema/companies';
import { hiringSignals } from '../schema/hiring-signals';

const toHiringSignal = (
  row: typeof hiringSignals.$inferSelect,
): HiringSignal => ({
  id: row.id,
  companyId: row.companyId,
  type: row.type,
  description: row.description,
  sourceUrl: row.sourceUrl,
  score: row.score,
  detectedAt: row.detectedAt,
  createdAt: row.createdAt,
});

export const createHiringSignalsRepository = (db: Db) => ({
  create: async (input: NewHiringSignal): Promise<HiringSignal> => {
    const [row] = await db
      .insert(hiringSignals)
      .values({
        companyId: input.companyId,
        type: input.type,
        description: input.description,
        sourceUrl: input.sourceUrl ?? null,
        score: input.score ?? 0,
        detectedAt: input.detectedAt ?? new Date(),
      })
      .returning();

    if (!row) {
      throw new Error('Failed to create hiring signal');
    }

    return toHiringSignal(row);
  },

  findById: async (id: string): Promise<HiringSignal | null> => {
    const [row] = await db
      .select()
      .from(hiringSignals)
      .where(eq(hiringSignals.id, id));
    return row ? toHiringSignal(row) : null;
  },

  listByCompanyId: async (companyId: string): Promise<HiringSignal[]> => {
    const rows = await db
      .select()
      .from(hiringSignals)
      .where(eq(hiringSignals.companyId, companyId));
    return rows.map(toHiringSignal);
  },

  deleteByCompanyId: async (companyId: string): Promise<number> => {
    const deleted = await db
      .delete(hiringSignals)
      .where(eq(hiringSignals.companyId, companyId))
      .returning();
    return deleted.length;
  },

  replaceForCompany: async (
    companyId: string,
    signals: NewHiringSignal[],
    hiringScore: number,
  ): Promise<void> => {
    await db.transaction(async (tx) => {
      await tx
        .delete(hiringSignals)
        .where(eq(hiringSignals.companyId, companyId));

      if (signals.length > 0) {
        await tx.insert(hiringSignals).values(
          signals.map((input) => ({
            companyId: input.companyId,
            type: input.type,
            description: input.description,
            sourceUrl: input.sourceUrl ?? null,
            score: input.score ?? 0,
            detectedAt: input.detectedAt ?? new Date(),
          })),
        );
      }

      await tx
        .update(companies)
        .set({ hiringScore, updatedAt: new Date() })
        .where(eq(companies.id, companyId));
    });
  },

  deleteById: async (id: string): Promise<boolean> => {
    const deleted = await db
      .delete(hiringSignals)
      .where(eq(hiringSignals.id, id))
      .returning();
    return deleted.length > 0;
  },
});

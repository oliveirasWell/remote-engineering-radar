import {
  Prisma,
  type HiringSignal as PrismaHiringSignal,
} from '@prisma/client';
import type { HiringSignal, NewHiringSignal } from '@/lib/hiring-signals/types';
import type { Db, RootDb } from '../client';

const toHiringSignal = (row: PrismaHiringSignal): HiringSignal => ({
  id: row.id,
  companyId: row.companyId,
  type: row.type,
  description: row.description,
  sourceUrl: row.sourceUrl,
  score: row.score,
  detectedAt: row.detectedAt,
  createdAt: row.createdAt,
});

type TransactionCapableDb = Db & Pick<RootDb, '$transaction'>;

const canStartTransaction = (db: Db): db is TransactionCapableDb =>
  '$transaction' in db && typeof db.$transaction === 'function';

export type CompanyHiringSignals = {
  companyId: string;
  signals: NewHiringSignal[];
  hiringScore: number;
};

/** Three statements for the whole batch, instead of three per company. */
const replaceMany = async (
  tx: Db,
  entries: CompanyHiringSignals[],
): Promise<void> => {
  // A repeated companyId would duplicate signals and leave the score to
  // whichever unnest row the join happened to match.
  const deduped = [
    ...new Map(entries.map((entry) => [entry.companyId, entry])).values(),
  ];
  const companyIds = deduped.map((entry) => entry.companyId);
  await tx.hiringSignal.deleteMany({
    where: { companyId: { in: companyIds } },
  });

  const now = new Date();
  const signals = deduped.flatMap((entry) =>
    entry.signals.map((input) => ({
      companyId: input.companyId,
      type: input.type,
      description: input.description,
      sourceUrl: input.sourceUrl ?? null,
      score: input.score ?? 0,
      detectedAt: input.detectedAt ?? now,
    })),
  );
  if (signals.length > 0) {
    await tx.hiringSignal.createMany({ data: signals });
  }

  await tx.$executeRaw(Prisma.sql`
    UPDATE companies SET hiring_score = scored.hiring_score, updated_at = ${now}
    FROM unnest(
      ${companyIds}::uuid[],
      ${deduped.map((entry) => entry.hiringScore)}::int[]
    ) AS scored(id, hiring_score)
    WHERE companies.id = scored.id
  `);
};

export const createHiringSignalsRepository = (db: Db) => {
  return {
    create: async (input: NewHiringSignal): Promise<HiringSignal> =>
      toHiringSignal(
        await db.hiringSignal.create({
          data: {
            companyId: input.companyId,
            type: input.type,
            description: input.description,
            sourceUrl: input.sourceUrl ?? null,
            score: input.score ?? 0,
            detectedAt: input.detectedAt ?? new Date(),
          },
        }),
      ),

    findById: async (id: string): Promise<HiringSignal | null> => {
      const row = await db.hiringSignal.findUnique({ where: { id } });
      return row ? toHiringSignal(row) : null;
    },

    listByCompanyId: async (companyId: string): Promise<HiringSignal[]> =>
      (await db.hiringSignal.findMany({ where: { companyId } })).map(
        toHiringSignal,
      ),

    listByCompanyIds: async (companyIds: string[]): Promise<HiringSignal[]> => {
      if (companyIds.length === 0) {
        return [];
      }

      const rows = await db.hiringSignal.findMany({
        where: { companyId: { in: companyIds } },
      });
      return rows.map(toHiringSignal);
    },

    deleteByCompanyId: async (companyId: string): Promise<number> =>
      (await db.hiringSignal.deleteMany({ where: { companyId } })).count,

    replaceForCompanies: async (
      entries: CompanyHiringSignals[],
    ): Promise<void> => {
      if (entries.length === 0) {
        return;
      }
      if (canStartTransaction(db)) {
        await db.$transaction((tx) => replaceMany(tx, entries));
        return;
      }

      await replaceMany(db, entries);
    },

    deleteById: async (id: string): Promise<boolean> =>
      (await db.hiringSignal.deleteMany({ where: { id } })).count > 0,
  };
};

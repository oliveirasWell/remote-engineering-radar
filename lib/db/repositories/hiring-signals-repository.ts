import type { HiringSignal as PrismaHiringSignal } from '@prisma/client';
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

export const createHiringSignalsRepository = (db: Db) => {
  const replace = async (
    tx: Db,
    companyId: string,
    signals: NewHiringSignal[],
    hiringScore: number,
  ): Promise<void> => {
    await tx.hiringSignal.deleteMany({ where: { companyId } });

    if (signals.length > 0) {
      await tx.hiringSignal.createMany({
        data: signals.map((input) => ({
          companyId: input.companyId,
          type: input.type,
          description: input.description,
          sourceUrl: input.sourceUrl ?? null,
          score: input.score ?? 0,
          detectedAt: input.detectedAt ?? new Date(),
        })),
      });
    }

    await tx.company.updateMany({
      where: { id: companyId },
      data: { hiringScore, updatedAt: new Date() },
    });
  };

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

    deleteByCompanyId: async (companyId: string): Promise<number> =>
      (await db.hiringSignal.deleteMany({ where: { companyId } })).count,

    replaceForCompany: async (
      companyId: string,
      signals: NewHiringSignal[],
      hiringScore: number,
    ): Promise<void> => {
      if (canStartTransaction(db)) {
        await db.$transaction((tx) =>
          replace(tx, companyId, signals, hiringScore),
        );
        return;
      }

      await replace(db, companyId, signals, hiringScore);
    },

    deleteById: async (id: string): Promise<boolean> =>
      (await db.hiringSignal.deleteMany({ where: { id } })).count > 0,
  };
};

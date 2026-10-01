import { Prisma } from '@prisma/client';
import type { Db } from '../client';

export type Ats = 'greenhouse' | 'ashby' | 'lever';

type BoardCandidate = { id: string; name: string };
type VerifiedBoard = {
  ats: Ats;
  slug: string;
  companyId: string;
  companyName: string;
  softwareCount: number;
};

export const createAtsBoardsRepository = (db: Db) => ({
  listCandidates: async (checkedBefore: Date): Promise<BoardCandidate[]> =>
    db.$queryRaw<BoardCandidate[]>(Prisma.sql`
      SELECT c.id, c.name
      FROM companies c
      JOIN jobs j ON j.company_id = c.id AND j.is_active
        AND j.role_focus @> '["software"]'::jsonb
      WHERE (c.board_checked_at IS NULL OR c.board_checked_at < ${checkedBefore})
        AND EXISTS (
          SELECT 1 FROM jobs evidence
          WHERE evidence.company_id = c.id AND evidence.is_active
            AND evidence.source IN ('himalayas', 'jobicy')
            AND evidence.role_focus @> '["software"]'::jsonb
        )
      GROUP BY c.id
      ORDER BY count(j.id) DESC, c.id
    `),

  listEvidenceTitles: async (companyId: string): Promise<string[]> =>
    (
      await db.job.findMany({
        where: {
          companyId,
          isActive: true,
          source: { in: ['himalayas', 'jobicy'] },
          roleFocus: { array_contains: ['software'] },
        },
        select: { title: true },
      })
    ).map((job) => job.title),

  markChecked: async (companyId: string, now: Date): Promise<void> => {
    await db.company.update({
      where: { id: companyId },
      data: { boardCheckedAt: now },
    });
  },

  insertVerified: async (
    ats: Ats,
    slug: string,
    companyId: string,
  ): Promise<boolean> =>
    (
      await db.atsBoard.createMany({
        data: [{ ats, slug, companyId }],
        skipDuplicates: true,
      })
    ).count > 0,

  listVerified: async (): Promise<VerifiedBoard[]> =>
    db.$queryRaw<VerifiedBoard[]>(Prisma.sql`
      SELECT b.ats, b.slug, b.company_id AS "companyId", c.name AS "companyName",
        count(j.id)::int AS "softwareCount"
      FROM ats_boards b
      JOIN companies c ON c.id = b.company_id
      LEFT JOIN jobs j ON j.company_id = c.id AND j.is_active
        AND j.role_focus @> '["software"]'::jsonb
      GROUP BY b.id, c.id
      ORDER BY count(j.id) DESC, b.slug
    `),

  remove: async (ats: Ats, slug: string): Promise<boolean> =>
    (await db.atsBoard.deleteMany({ where: { ats, slug } })).count > 0,
});

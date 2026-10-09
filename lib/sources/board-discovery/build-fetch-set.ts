import type { Ats } from '@/lib/db/repositories/ats-boards-repository';

type VerifiedBoard = {
  ats: Ats;
  slug: string;
  companyName: string;
  softwareCount: number;
};
export type FetchBoard = { slug: string; companyName?: string };

export const buildFetchSet = (
  ats: Ats,
  seeds: readonly string[],
  verified: VerifiedBoard[],
  maximum: number,
): FetchBoard[] => {
  if (seeds.length > maximum) {
    throw new Error(`At most ${maximum} boards may be configured`);
  }
  const ranked = verified
    .filter((board) => board.ats === ats)
    .sort(
      (left, right) =>
        right.softwareCount - left.softwareCount ||
        left.slug.localeCompare(right.slug),
    );
  const bySlug = new Map(
    ranked.map((board) => [board.slug, board.companyName]),
  );
  const slugs = [
    ...new Set([...seeds, ...ranked.map((board) => board.slug)]),
  ].slice(0, maximum);
  return slugs.map((slug) => ({
    slug,
    ...(bySlug.has(slug) ? { companyName: bySlug.get(slug) } : {}),
  }));
};

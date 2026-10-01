import { normalizeCompanyName } from '@/lib/deduplication/normalize';

const GENERIC_WORDS = new Set([
  'inc',
  'llc',
  'ltd',
  'gmbh',
  'pvt',
  'pty',
  'corp',
  'corporation',
  'group',
  'technologies',
  'technology',
  'solutions',
  'consulting',
  'international',
  'labs',
]);

export const buildSlugCandidates = (name: string): string[] => {
  const words = normalizeCompanyName(name).split(' ').filter(Boolean);
  return [
    ...new Set(
      [
        words.join(''),
        words.filter((word) => !GENERIC_WORDS.has(word)).join(''),
      ].filter(Boolean),
    ),
  ];
};

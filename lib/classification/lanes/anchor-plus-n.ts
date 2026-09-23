import { countMatches } from './count-matches';
import type { LaneMatcher } from './types';

/**
 * A title anchor names the discipline; `n` support terms prove the posting is
 * actually about it. A title alone is never enough.
 */
export const anchorPlusN =
  ({
    anchors,
    support,
    n,
  }: {
    anchors: readonly RegExp[];
    support: readonly RegExp[];
    n: number;
  }): LaneMatcher =>
  (input) =>
    anchors.some((anchor) => anchor.test(input.title)) &&
    countMatches(support, input.haystack) >= n;

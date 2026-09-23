import { countMatches } from './count-matches';
import type { LaneMatcher } from './types';

/**
 * A title that names the technology is a decision the poster made; a body
 * that mentions it is not, so it has to bring `n` support terms with it.
 */
export const titleAnchorOrBodyPlusN =
  ({
    titleAnchors,
    bodyAnchors,
    support,
    n,
  }: {
    titleAnchors: readonly RegExp[];
    bodyAnchors: readonly RegExp[];
    support: readonly RegExp[];
    n: number;
  }): LaneMatcher =>
  (input) =>
    titleAnchors.some((anchor) => anchor.test(input.title)) ||
    (bodyAnchors.some((anchor) => anchor.test(input.haystack)) &&
      countMatches(support, input.haystack) >= n);

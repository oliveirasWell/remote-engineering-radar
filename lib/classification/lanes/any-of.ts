import { countMatches } from './count-matches';
import type { LaneMatcher } from './types';

/**
 * At least `n` terms. `titleOnly` is what keeps a lane whose vocabulary is a
 * job title ("Product Manager") off every body that merely names one.
 */
export const anyOf =
  ({
    terms,
    n = 1,
    titleOnly = false,
  }: {
    terms: readonly RegExp[];
    n?: number;
    titleOnly?: boolean;
  }): LaneMatcher =>
  (input) =>
    countMatches(terms, titleOnly ? input.title : input.haystack) >= n;

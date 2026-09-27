import type { LaneRule } from './types';

/**
 * The title names none of `terms`. One exclusion for every lane: a competing
 * stack ("Angular Developer") or a position the lane does not cover
 * ("Mobile QA Analyst").
 */
export const titleMatchesNone =
  (terms: readonly RegExp[]): LaneRule =>
  (input) =>
    !terms.some((term) => term.test(input.title));

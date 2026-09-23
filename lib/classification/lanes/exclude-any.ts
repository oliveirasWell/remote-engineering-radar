import type { LaneMatcher } from './types';

/** A title veto: the posting names a competing stack, whatever its body says. */
export const excludeAny =
  ({
    vetoes,
    strategy,
  }: {
    vetoes: readonly RegExp[];
    strategy: LaneMatcher;
  }): LaneMatcher =>
  (input) =>
    !vetoes.some((veto) => veto.test(input.title)) && strategy(input);

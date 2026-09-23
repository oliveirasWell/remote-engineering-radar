/** A term counts at most once, however often it appears. */
export const countMatches = (terms: readonly RegExp[], text: string): number =>
  terms.filter((term) => term.test(text)).length;

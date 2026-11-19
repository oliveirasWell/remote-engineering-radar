/** Median of the values, or undefined for an empty list. */
export const median = (values: readonly number[]): number | undefined => {
  if (values.length === 0) {
    return undefined;
  }
  const sorted = values.toSorted((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
};

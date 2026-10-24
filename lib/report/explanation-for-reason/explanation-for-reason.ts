/** A classifier reason uses its written explanation; a technology name does not. */
export const explanationForReason = (
  reason: string,
  known: Record<string, string>,
  technology: (name: string) => string,
): string => {
  const written = known[reason];
  return written === undefined ? technology(reason) : written;
};

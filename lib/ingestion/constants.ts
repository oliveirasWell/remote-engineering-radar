export const INGESTION_TRANSACTION_TIMEOUT_MS = 600_000;

/**
 * First ingest run that stopped copying body-text geography into `countries`
 * (PR #48). A row last seen before it still carries those guesses.
 */
export const LEGACY_GEOGRAPHY_COUNTRIES_CUTOFF = new Date(
  '2026-09-22T03:40:30Z',
);

/** The slugs the pre-#48 ingestion derived from body-text geography. */
export const LEGACY_GEOGRAPHY_COUNTRIES = [
  'brazil',
  'worldwide',
  'united-states',
  'canada',
] as const;

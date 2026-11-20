export const JOOBLE_SOURCE_NAME = 'jooble';
/** The Brazilian partner API; a key is tied to one Jooble country. */
export const JOOBLE_API_BASE_URL = 'https://br.jooble.org/api/';
export const JOOBLE_LOCATION = 'Brasil';
/** Recruiting searches only: the radar reads Jooble for the recruiting lane. */
export const JOOBLE_QUERIES = [
  'recrutador',
  'tech recruiter',
  'talent acquisition',
  'recrutamento e seleção',
] as const;
export const JOOBLE_RESULTS_PER_PAGE = 50;
export const JOOBLE_MAX_PAGES = 2;
/**
 * Jooble orders by relevance; the undocumented `datecreatedfrom` keeps recent
 * postings (median age 3 days instead of 8 on 2026-11-20). Two days cover a
 * daily ingest that runs late.
 */
export const JOOBLE_LOOKBACK_MS = 2 * 24 * 60 * 60 * 1000;

export const HIMALAYAS_SOURCE_NAME = 'himalayas';
export const HIMALAYAS_API_BASE_URL = 'https://himalayas.app/jobs/api';
/** The API caps a page at 20 records and ignores any larger `limit`. */
export const HIMALAYAS_PAGE_SIZE = 20;
/** About two days of postings, so a daily ingest never misses a live job. */
export const HIMALAYAS_MAX_PAGES = 100;
/**
 * Himalayas lists every country a job is restricted to, so an empty list
 * means anyone can apply.
 */
export const HIMALAYAS_UNRESTRICTED_COUNTRIES = ['Worldwide'];

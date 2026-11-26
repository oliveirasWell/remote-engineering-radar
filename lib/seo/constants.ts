/**
 * The one public origin. Production always uses it; SITE_URL only points
 * previews and local runs elsewhere.
 */
export const CANONICAL_SITE_ORIGIN = 'https://remote-engineering-radar.me';
/** Any Vercel-assigned host; matched as a full regular expression. */
export const VERCEL_HOST_PATTERN = '.+\\.vercel\\.app';
export const SITE_URL_ERROR =
  'SITE_URL must be an absolute HTTP(S) origin without credentials, path, query, or fragment.';
export const SITEMAP_CACHE_LIFE = {
  stale: 300,
  revalidate: 300,
  expire: 3600,
} as const;

/**
 * A single country or focus view is indexed only with at least this many
 * jobs, so search engines never see near-empty pages.
 */
export const MIN_INDEXABLE_JOBS = 10;

export const GUIDE_PATH = '/how-it-works';
export const PRIVACY_PATH = '/privacy';

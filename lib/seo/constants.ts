// Public deployment documented in specs/014-observability.md.
export const DEFAULT_SITE_ORIGIN =
  'https://remote-engineering-radar.vercel.app';
export const SITE_URL_ERROR =
  'SITE_URL must be an absolute HTTP(S) origin without credentials, path, query, or fragment.';
export const SITEMAP_CACHE_LIFE = {
  stale: 300,
  revalidate: 300,
  expire: 3600,
} as const;

import { CANONICAL_SITE_ORIGIN, VERCEL_HOST_PATTERN } from '../constants';

/**
 * Production answers only on the canonical origin, so crawlers never index a
 * second copy under *.vercel.app. Previews keep their own hosts.
 */
export const canonicalHostRedirects = (vercelEnv: string | undefined) =>
  vercelEnv === 'production'
    ? [
        {
          source: '/:path*',
          has: [{ type: 'host' as const, value: VERCEL_HOST_PATTERN }],
          destination: `${CANONICAL_SITE_ORIGIN}/:path*`,
          permanent: true,
        },
      ]
    : [];

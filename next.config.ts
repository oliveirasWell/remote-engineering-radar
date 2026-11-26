import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs/config';
import {
  LOCALE_REDIRECTS,
  LOCALE_REWRITES,
} from './lib/i18n/locale-routes/locale-routes';
import { canonicalHostRedirects } from './lib/seo/canonical-host-redirects/canonical-host-redirects';

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Keep document status codes for missing jobs and failed metadata reads.
  htmlLimitedBots: /.*/,
  reactCompiler: true,
  poweredByHeader: false,
  redirects: async () => [
    ...canonicalHostRedirects(process.env.VERCEL_ENV),
    ...LOCALE_REDIRECTS,
  ],
  rewrites: async () => ({
    beforeFiles: LOCALE_REWRITES,
    afterFiles: [],
    fallback: [],
  }),
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'DENY' },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=()',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=31536000; includeSubDomains',
        },
      ],
    },
  ],
};

export default withSentryConfig(nextConfig, {
  org: 'wellington-oliveira',
  project: 'remote-engineering-radar',
  silent: !process.env.CI,
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },
  authToken: process.env.SENTRY_AUTH_TOKEN,
});

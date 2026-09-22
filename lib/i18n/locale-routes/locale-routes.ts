import { LOCALE_COOKIE } from '../messages';

/**
 * Any page path without a locale prefix: no `/pt-BR` or `/en` segment, no
 * framework or API route, and no dot, so files such as /sitemap.xml and
 * /opengraph-image.jpg are served untouched.
 */
const UNPREFIXED_PAGE = '(?!(?:pt-BR|en)(?:/|$)|_next/|api/)[^.]+';

const RETURNING_PORTUGUESE_READER = [
  { type: 'cookie' as const, key: LOCALE_COOKIE, value: 'pt-BR' },
];

/** English keeps its unprefixed URLs; the app renders them under app/[lang]. */
export const LOCALE_REWRITES = [
  { source: '/', destination: '/en' },
  { source: `/:path(${UNPREFIXED_PAGE})`, destination: '/en/:path' },
];

export const LOCALE_REDIRECTS = [
  // One URL per English page.
  { source: '/en', destination: '/', permanent: true },
  { source: '/en/:path*', destination: '/:path*', permanent: true },
  // The language picker's cookie keeps a reader in Portuguese. There is no
  // Accept-Language redirect: crawlers send none.
  {
    source: '/',
    has: RETURNING_PORTUGUESE_READER,
    destination: '/pt-BR',
    permanent: false,
  },
  {
    source: `/:path(${UNPREFIXED_PAGE})`,
    has: RETURNING_PORTUGUESE_READER,
    destination: '/pt-BR/:path',
    permanent: false,
  },
];

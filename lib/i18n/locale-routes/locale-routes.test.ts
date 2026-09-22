import { createRequire } from 'node:module';
import { LOCALE_COOKIE } from '../messages';
import { LOCALE_REDIRECTS, LOCALE_REWRITES } from './locale-routes';

// The matcher Next itself compiles `source` patterns with; it ships untyped.
const { pathToRegexp } = createRequire(import.meta.url)(
  'next/dist/compiled/path-to-regexp',
) as { pathToRegexp: (path: string) => RegExp };

const PAGE_PATHS = ['/jobs', '/jobs/abc-123', '/about', '/english'];
const SKIPPED_PATHS = [
  '/pt-BR',
  '/pt-BR/jobs',
  '/_next/static/chunk.js',
  '/sitemap.xml',
  '/robots.txt',
  '/icon.png',
  '/opengraph-image.jpg',
  '/api/health',
];

type Route = { source: string; destination: string };

const routeFor = (routes: readonly Route[], path: string) =>
  routes.find(({ source }) => pathToRegexp(source).test(path));

describe('locale routes', () => {
  it('serves every unprefixed page from the English route', () => {
    expect(routeFor(LOCALE_REWRITES, '/')?.destination).toBe('/en');
    for (const path of PAGE_PATHS) {
      expect(routeFor(LOCALE_REWRITES, path)?.destination).toBe('/en/:path');
    }
    for (const path of SKIPPED_PATHS) {
      expect(routeFor(LOCALE_REWRITES, path)).toBeUndefined();
    }
  });

  it('gives English one URL by redirecting the /en prefix away', () => {
    const english = LOCALE_REDIRECTS.filter((route) => !route.has);
    expect(routeFor(english, '/en')).toMatchObject({
      destination: '/',
      permanent: true,
    });
    expect(routeFor(english, '/en/jobs')).toMatchObject({
      destination: '/:path*',
      permanent: true,
    });
  });

  it('sends a returning Portuguese reader from an unprefixed page to its Portuguese URL', () => {
    const returning = LOCALE_REDIRECTS.filter((route) => route.has);
    for (const route of returning) {
      expect(route).toMatchObject({
        permanent: false,
        has: [{ type: 'cookie', key: LOCALE_COOKIE, value: 'pt-BR' }],
      });
    }
    expect(routeFor(returning, '/')?.destination).toBe('/pt-BR');
    expect(routeFor(returning, '/jobs')?.destination).toBe('/pt-BR/:path');
    expect(routeFor(returning, '/pt-BR/jobs')).toBeUndefined();
  });
});

import { DEFAULT_SITE_ORIGIN } from '@/lib/seo/constants';
import robots from './robots';

const CUSTOM_ORIGIN = 'https://radar.example.com';

afterEach(() => vi.unstubAllEnvs());

it.each([DEFAULT_SITE_ORIGIN, CUSTOM_ORIGIN])(
  'advertises the trusted sitemap without blocking filtered pages from reading noindex (%s)',
  (origin) => {
    vi.stubEnv('SITE_URL', origin);
    expect(robots()).toStrictEqual({
      rules: { userAgent: '*', allow: '/' },
      sitemap: `${origin}/sitemap.xml`,
    });
  },
);

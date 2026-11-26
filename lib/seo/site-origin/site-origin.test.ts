import { DEFAULT_SITE_ORIGIN, SITE_URL_ERROR } from '../constants';
import { siteOrigin } from './site-origin';

const CUSTOM_ORIGIN = 'https://radar.example.com';
const LOCAL_ORIGIN = 'http://localhost:3000';
const INVALID_ORIGINS = [
  'not a url',
  '//radar.example.com',
  'ftp://radar.example.com',
  `${CUSTOM_ORIGIN}/jobs`,
  `${CUSTOM_ORIGIN}?tracking=true`,
  `${CUSTOM_ORIGIN}#fragment`,
  'https://user:password@radar.example.com',
];

afterEach(() => vi.unstubAllEnvs());

describe('siteOrigin', () => {
  it.each([undefined, '', '   '])(
    'uses the trusted deployment for an unset or empty SITE_URL %j',
    (value) => {
      vi.stubEnv('SITE_URL', value);
      vi.stubEnv('VERCEL_URL', 'untrusted-preview.example.com');
      expect(siteOrigin().origin).toBe(DEFAULT_SITE_ORIGIN);
    },
  );

  it.each([CUSTOM_ORIGIN, LOCAL_ORIGIN])(
    'accepts an explicit HTTP(S) origin %s',
    (origin) => {
      vi.stubEnv('SITE_URL', ` ${origin}/ `);
      expect(siteOrigin().origin).toBe(origin);
    },
  );

  it.each(INVALID_ORIGINS)(
    'rejects invalid/non-origin SITE_URL %s',
    (value) => {
      vi.stubEnv('SITE_URL', value);
      expect(siteOrigin).toThrow(SITE_URL_ERROR);
    },
  );
});

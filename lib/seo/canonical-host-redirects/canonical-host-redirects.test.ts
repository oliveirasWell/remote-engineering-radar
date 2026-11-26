import { CANONICAL_SITE_ORIGIN } from '../constants';
import { canonicalHostRedirects } from './canonical-host-redirects';

const PRODUCTION_HOSTS = [
  'remote-engineering-radar.vercel.app',
  'remote-engineering-radar-git-main-team.vercel.app',
];
const CANONICAL_HOST = new URL(CANONICAL_SITE_ORIGIN).host;

/** Next.js anchors a `has` host value as a full regular expression. */
const matchesHost = (pattern: string, host: string) =>
  new RegExp(`^${pattern}$`).test(host);

describe('canonicalHostRedirects', () => {
  it('permanently redirects every production vercel.app path to the canonical origin', () => {
    const [redirect, ...rest] = canonicalHostRedirects('production');
    expect(rest).toStrictEqual([]);
    expect(redirect).toMatchObject({
      source: '/:path*',
      destination: `${CANONICAL_SITE_ORIGIN}/:path*`,
      permanent: true,
    });
    const [host] = redirect.has;
    for (const productionHost of PRODUCTION_HOSTS) {
      expect(matchesHost(host.value, productionHost)).toBe(true);
    }
    expect(matchesHost(host.value, CANONICAL_HOST)).toBe(false);
  });

  it.each(['preview', 'development', undefined])(
    'leaves %s deployments on their own host',
    (environment) => {
      expect(canonicalHostRedirects(environment)).toStrictEqual([]);
    },
  );
});

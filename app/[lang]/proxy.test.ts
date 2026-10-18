import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server';
import { NextRequest } from 'next/server';
import { config, proxy } from '../../proxy';

it('removes bot detection only for unfiltered home documents', () => {
  for (const url of ['/', '/pt-BR']) {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(
      true,
    );
  }
  for (const url of [
    '/?country=brazil',
    '/pt-BR?focus=cloud-ops',
    '/jobs/00000000-0000-0000-0000-000000000000',
  ]) {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig: {}, url })).toBe(
      false,
    );
  }

  const request = new NextRequest('https://example.com/', {
    headers: { 'user-agent': 'Googlebot', cookie: 'locale=pt-BR' },
  });
  const response = proxy(request);
  const forwarded = response.headers.get('x-middleware-override-headers');
  expect(forwarded).not.toContain('user-agent');
  expect(forwarded).toContain('cookie');
});

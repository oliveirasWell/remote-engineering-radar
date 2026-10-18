import { NextResponse, type NextRequest } from 'next/server';

export const proxy = (request: NextRequest) => {
  const headers = new Headers(request.headers);
  headers.delete('user-agent');
  return NextResponse.next({ request: { headers } });
};

export const config = {
  matcher: [
    {
      source: '/',
      missing: [
        { type: 'query', key: 'country' },
        { type: 'query', key: 'focus' },
      ],
    },
    {
      source: '/pt-BR',
      missing: [
        { type: 'query', key: 'country' },
        { type: 'query', key: 'focus' },
      ],
    },
  ],
};

import { getDb } from '@/lib/db/client';
import { resendRequest } from '@/lib/newsletter/resend';
import { POST } from './route';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock('@/lib/newsletter/resend', () => ({
  resendConfig: () => ({ from: 'Jobs <jobs@example.com>' }),
  resendRequest: vi.fn(async () => ({ id: 'test' })),
}));

const db = {
  newsletterSubscription: {
    findUnique: vi.fn(async () => null),
    count: vi.fn(async () => 0),
    upsert: vi.fn(async () => ({})),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
};

const request = (input: unknown, origin = 'https://example.com') =>
  new Request('https://example.com/api/newsletter/subscribe', {
    method: 'POST',
    headers: { origin, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDb).mockReturnValue(db as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it('rejects cross-origin requests and unknown lanes without writing or sending', async () => {
  expect((await POST(request({}, 'https://elsewhere.example'))).status).toBe(
    403,
  );
  expect(
    (
      await POST(
        request({
          email: 'a@example.com',
          focus: 'fake',
          country: null,
          locale: 'en',
        }),
      )
    ).status,
  ).toBe(400);
  expect(db.newsletterSubscription.upsert).not.toHaveBeenCalled();
  expect(resendRequest).not.toHaveBeenCalled();
});

it('sends confirmation without marking a subscription active', async () => {
  const response = await POST(
    request({
      email: 'Person@Example.com',
      focus: 'engineering',
      country: 'brazil',
      locale: 'pt-BR',
    }),
  );
  expect(response.status).toBe(202);
  expect(db.newsletterSubscription.upsert).toHaveBeenCalledWith(
    expect.objectContaining({
      where: { email: 'person@example.com' },
      create: expect.objectContaining({
        pendingFocus: 'engineering',
        pendingCountry: 'brazil',
      }),
    }),
  );
  expect(resendRequest).toHaveBeenCalledWith(
    '/emails',
    expect.objectContaining({
      body: expect.objectContaining({ to: 'person@example.com' }),
    }),
  );
});

it('does not resend a recent confirmation or exceed the free daily cap', async () => {
  db.newsletterSubscription.findUnique.mockResolvedValueOnce({
    tokenIssuedAt: new Date(),
  } as never);
  expect(
    (
      await POST(
        request({
          email: 'a@example.com',
          focus: 'engineering',
          country: null,
          locale: 'en',
        }),
      )
    ).status,
  ).toBe(202);
  db.newsletterSubscription.count.mockResolvedValueOnce(80);
  expect(
    (
      await POST(
        request({
          email: 'b@example.com',
          focus: 'engineering',
          country: null,
          locale: 'en',
        }),
      )
    ).status,
  ).toBe(429);
  expect(resendRequest).not.toHaveBeenCalled();
});

it('does not issue production confirmation links from an unconfigured beta', async () => {
  vi.stubEnv('VERCEL_ENV', 'preview');
  vi.stubEnv('SITE_URL', '');
  const response = await POST(
    request({
      email: 'person@example.com',
      focus: 'engineering',
      country: 'brazil',
      locale: 'en',
    }),
  );
  expect(response.status).toBe(503);
  expect(getDb).not.toHaveBeenCalled();
  expect(resendRequest).not.toHaveBeenCalled();
});

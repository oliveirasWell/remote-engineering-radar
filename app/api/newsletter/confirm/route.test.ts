import { createHash } from 'node:crypto';
import { getDb } from '@/lib/db/client';
import { resendRequest } from '@/lib/newsletter/resend';
import { GET, POST } from './route';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock('@/lib/newsletter/resend', () => ({
  resendConfig: () => ({ segmentId: 'segment' }),
  resendRequest: vi.fn(async () => ({ id: 'contact' })),
  ResendError: class extends Error {
    constructor(readonly status: number) {
      super();
    }
  },
}));

const token = 'a'.repeat(43);
const hash = createHash('sha256').update(token).digest('hex');
const db = {
  newsletterSubscription: {
    findUnique: vi.fn(async () => ({
      email: 'person@example.com',
      tokenHash: hash,
      tokenIssuedAt: new Date(),
      pendingFocus: 'engineering',
      pendingCountry: 'brazil',
      pendingLocale: 'pt-BR',
    })),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getDb).mockReturnValue(db as never);
});

it('shows a confirmation form without activating the subscription on GET', async () => {
  const response = await GET(
    new Request(`https://example.com/api/newsletter/confirm?token=${token}`),
  );
  expect(response.status).toBe(200);
  expect(response.headers.get('Referrer-Policy')).toBe('no-referrer');
  expect(await response.text()).toContain('method="post"');
  expect(db.newsletterSubscription.updateMany).not.toHaveBeenCalled();
});

it('confirms ownership before adding a contact to the broadcast', async () => {
  const response = await POST(
    new Request('https://example.com/api/newsletter/confirm', {
      method: 'POST',
      body: new URLSearchParams({ token }),
    }),
  );
  expect(response.status).toBe(200);
  expect(db.newsletterSubscription.findUnique).toHaveBeenCalledWith({
    where: { tokenHash: hash },
  });
  expect(resendRequest).toHaveBeenCalledWith(
    '/contacts',
    expect.objectContaining({
      body: expect.objectContaining({
        email: 'person@example.com',
        segments: [{ id: 'segment' }],
      }),
    }),
  );
  expect(db.newsletterSubscription.updateMany).toHaveBeenCalledWith(
    expect.objectContaining({
      data: expect.objectContaining({
        focus: 'engineering',
        country: 'brazil',
        tokenHash: null,
      }),
    }),
  );
});

it('rejects malformed tokens without touching the database', async () => {
  const response = await POST(
    new Request('https://example.com/api/newsletter/confirm', {
      method: 'POST',
      body: new URLSearchParams({ token: '<script>' }),
    }),
  );
  expect(response.status).toBe(400);
  expect(getDb).not.toHaveBeenCalled();
});

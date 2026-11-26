import { getDb } from '@/lib/db/client';
import {
  DIGEST_SEGMENT_EN,
  DIGEST_SEGMENT_PT,
} from '@/lib/newsletter/digest-email/fixtures';
import { resendRequest } from '@/lib/newsletter/resend';
import { SEGMENT_ENV_BY_LOCALE } from '@/lib/newsletter/segment-for-locale/segment-for-locale';
import { DELETE, GET, PUT } from './route';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock('@/lib/newsletter/resend', () => ({
  resendRequest: vi.fn(async () => ({ id: 'contact' })),
  ResendError: class extends Error {
    constructor(readonly status: number) {
      super();
    }
  },
}));

const TOKEN = 'radar-api-token';
const ORIGIN = 'https://radar.example';
const PATH = '/api/newsletter/members';
const EMAIL = 'member@example.com';
const LANE = { focus: 'engineering', country: 'brazil', locale: 'pt-BR' };

const db = {
  newsletterSubscription: {
    findUnique: vi.fn(),
    upsert: vi.fn(async () => ({})),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
};

const call = (
  handler: (request: Request) => Promise<Response>,
  {
    method,
    body,
    query = '',
    token = TOKEN,
  }: { method: string; body?: unknown; query?: string; token?: string },
) =>
  handler(
    new Request(`${ORIGIN}${PATH}${query}`, {
      method,
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('RADAR_API_TOKEN', TOKEN);
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE.en, DIGEST_SEGMENT_EN);
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE['pt-BR'], DIGEST_SEGMENT_PT);
  vi.mocked(getDb).mockReturnValue(db as never);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('/api/newsletter/members', () => {
  it.each([
    ['GET', GET, undefined],
    ['PUT', PUT, { email: EMAIL, ...LANE }],
    ['DELETE', DELETE, { email: EMAIL }],
  ] as const)(
    'rejects %s with a wrong token without touching data',
    async (method, handler, body) => {
      const response = await call(handler, {
        method,
        body,
        query: `?email=${EMAIL}`,
        token: 'wrong',
      });

      expect(response.status).toBe(401);
      expect(getDb).not.toHaveBeenCalled();
      expect(resendRequest).not.toHaveBeenCalled();
    },
  );

  it('subscribes a verified member directly, without a confirmation email', async () => {
    const response = await call(PUT, {
      method: 'PUT',
      body: { email: EMAIL.toUpperCase(), ...LANE },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscribed: true, ...LANE });
    expect(resendRequest).toHaveBeenCalledWith(
      '/contacts',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          email: EMAIL,
          segments: [{ id: DIGEST_SEGMENT_PT }],
        }),
      }),
    );
    expect(resendRequest).toHaveBeenCalledWith(
      `/contacts/${encodeURIComponent(EMAIL)}/segments/${DIGEST_SEGMENT_EN}`,
      { method: 'DELETE' },
    );
    expect(resendRequest).not.toHaveBeenCalledWith(
      '/emails',
      expect.anything(),
    );
    expect(db.newsletterSubscription.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: EMAIL },
        create: expect.objectContaining({
          ...LANE,
          confirmedAt: expect.any(Date),
        }),
        update: expect.objectContaining({
          ...LANE,
          tokenHash: null,
          confirmedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('rejects an unknown lane', async () => {
    const response = await call(PUT, {
      method: 'PUT',
      body: { email: EMAIL, ...LANE, focus: 'astronomy' },
    });

    expect(response.status).toBe(400);
    expect(resendRequest).not.toHaveBeenCalled();
  });

  it('reports the current subscription', async () => {
    db.newsletterSubscription.findUnique.mockResolvedValue({
      email: EMAIL,
      confirmedAt: new Date(),
      ...LANE,
    });

    const response = await call(GET, {
      method: 'GET',
      query: `?email=${encodeURIComponent(EMAIL)}`,
    });

    expect(await response.json()).toEqual({ subscribed: true, ...LANE });
  });

  it('reports no subscription for an unknown address', async () => {
    db.newsletterSubscription.findUnique.mockResolvedValue(null);

    const response = await call(GET, {
      method: 'GET',
      query: `?email=${encodeURIComponent(EMAIL)}`,
    });

    expect(await response.json()).toEqual({ subscribed: false });
  });

  it('unsubscribes in Resend before clearing the confirmation', async () => {
    const response = await call(DELETE, {
      method: 'DELETE',
      body: { email: EMAIL },
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ subscribed: false });
    expect(resendRequest).toHaveBeenCalledWith(
      `/contacts/${encodeURIComponent(EMAIL)}`,
      { method: 'PATCH', body: { unsubscribed: true } },
    );
    expect(db.newsletterSubscription.updateMany).toHaveBeenCalledWith({
      where: { email: EMAIL },
      data: { confirmedAt: null },
    });
  });
});

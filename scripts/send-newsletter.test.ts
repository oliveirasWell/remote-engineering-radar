import type { RootDb } from '../lib/db/client';
import { resendRequest } from '../lib/newsletter/resend';
import { digestText, sendNewsletter } from './send-newsletter';

vi.mock('../lib/newsletter/resend', () => ({
  resendConfig: () => ({
    from: 'Jobs <jobs@example.com>',
    segmentId: 'test-segment',
  }),
  resendRequest: vi.fn(),
}));

const mockDb = {
  newsletterDispatch: {
    findUnique: vi.fn(async () => null),
    findFirst: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
  },
  newsletterSubscription: {
    findMany: vi.fn(async () => [
      {
        email: 'one@example.com',
        focus: 'engineering',
        country: 'brazil',
        locale: 'pt-BR',
      },
    ]),
  },
  job: {
    findMany: vi.fn(async () => [
      {
        id: '00000000-0000-0000-0000-000000000001',
        title: 'Remote React',
        company: { name: 'Acme' },
      },
    ]),
  },
};
const db = mockDb as unknown as RootDb;

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(resendRequest).mockReset();
  vi.mocked(resendRequest)
    .mockResolvedValueOnce({
      data: [{ email: 'one@example.com', unsubscribed: false }],
    })
    .mockResolvedValueOnce({ id: 'updated' })
    .mockResolvedValueOnce({ id: 'draft' })
    .mockResolvedValueOnce({ id: 'draft' });
});

it('uses the saved lane/country and updates the personalized digest before sending once', async () => {
  const count = await sendNewsletter(db, new Date('2026-10-28T11:00:00Z'));
  expect(count).toBe(1);
  expect(mockDb.job.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        isActive: true,
        firstSeenAt: { gt: expect.any(Date) },
      }),
    }),
  );
  expect(resendRequest).toHaveBeenCalledWith(
    '/contacts/one%40example.com',
    expect.objectContaining({
      body: {
        properties: { daily_jobs: expect.stringContaining('Remote React') },
      },
    }),
  );
  expect(mockDb.newsletterDispatch.create).toHaveBeenCalledWith({
    data: { date: '2026-10-28', broadcastId: 'draft' },
  });
  expect(mockDb.newsletterDispatch.update).toHaveBeenCalledOnce();
});

it('never sends a broadcast to a contact that was not confirmed locally', async () => {
  mockDb.newsletterSubscription.findMany.mockResolvedValueOnce([]);
  await expect(sendNewsletter(db)).rejects.toThrow(
    'without a confirmed subscription',
  );
  expect(mockDb.newsletterDispatch.create).not.toHaveBeenCalled();
});

it('does not send twice on the same day or broadcast an empty digest', async () => {
  mockDb.newsletterDispatch.findUnique.mockResolvedValueOnce({
    date: '2026-10-28',
  } as never);
  expect(await sendNewsletter(db, new Date('2026-10-28T11:00:00Z'))).toBe(0);
  expect(resendRequest).not.toHaveBeenCalled();

  mockDb.job.findMany.mockResolvedValueOnce([]);
  expect(await sendNewsletter(db, new Date('2026-10-29T11:00:00Z'))).toBe(0);
  expect(resendRequest).toHaveBeenCalledTimes(1);
  expect(mockDb.newsletterDispatch.create).not.toHaveBeenCalled();
});

it('keeps provider templates out of the job text', () => {
  expect(
    digestText(
      [{ id: 'test', title: '{{{contact.email}}}', company: { name: 'Acme' } }],
      'en',
      new URL('https://example.com'),
    ),
  ).not.toContain('{{{contact.email}}}');
});

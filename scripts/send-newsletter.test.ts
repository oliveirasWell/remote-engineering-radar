import type { RootDb } from '../lib/db/client';
import { messagesFor } from '../lib/i18n/messages';
import {
  DIGEST_JOBS_HTML_PROPERTY,
  DIGEST_JOBS_TEXT_PROPERTY,
  DIGEST_LANE_URL_PROPERTY,
} from '../lib/newsletter/digest-email/constants';
import {
  DIGEST_COUNTRY,
  DIGEST_EMAIL,
  DIGEST_EMAIL_SECOND,
  DIGEST_FOCUS,
  DIGEST_FROM,
  DIGEST_JOBS,
  DIGEST_ORIGIN,
  DIGEST_SEGMENT_EN,
  DIGEST_SEGMENT_PT,
} from '../lib/newsletter/digest-email/fixtures';
import {
  RESEND_API_KEY_ENV,
  RESEND_FROM_ENV,
} from '../lib/newsletter/constants';
import { resendRequest } from '../lib/newsletter/resend';
import { SEGMENT_ENV_BY_LOCALE } from '../lib/newsletter/segment-for-locale/segment-for-locale';
import { sendNewsletter } from './send-newsletter';

vi.mock('../lib/newsletter/resend', async () => {
  const actual = await vi.importActual<
    typeof import('../lib/newsletter/resend')
  >('../lib/newsletter/resend');
  return { ...actual, resendRequest: vi.fn() };
});

const JOB = {
  id: DIGEST_JOBS[0].id,
  title: DIGEST_JOBS[0].title,
  company: { name: DIGEST_JOBS[0].companyName },
};
const CONTACT = { email: DIGEST_EMAIL, unsubscribed: false };
const PT_SUBSCRIBER = {
  email: DIGEST_EMAIL,
  focus: DIGEST_FOCUS,
  country: DIGEST_COUNTRY,
  locale: 'pt-BR',
};
const EN_SUBSCRIBER = {
  ...PT_SUBSCRIBER,
  email: DIGEST_EMAIL_SECOND,
  locale: 'en',
};
const SENT_AT = new Date('2026-10-28T11:00:00Z');
const PROPERTY_PAGE = {
  has_more: false,
  data: [
    { id: 'property-text', key: DIGEST_JOBS_TEXT_PROPERTY },
    { id: 'property-html', key: DIGEST_JOBS_HTML_PROPERTY },
    { id: 'property-lane', key: DIGEST_LANE_URL_PROPERTY },
  ],
};

const mockDb = {
  newsletterDispatch: {
    findUnique: vi.fn(async () => null),
    findFirst: vi.fn(async () => null),
    create: vi.fn(async () => ({})),
    update: vi.fn(async () => ({})),
  },
  newsletterSubscription: {
    findMany: vi.fn(async () => [PT_SUBSCRIBER]),
  },
  job: {
    findMany: vi.fn(async () => [JOB]),
  },
};
const db = mockDb as unknown as RootDb;

const calls: { path: string; method?: string; body?: unknown }[] = [];

const mockResend = () => {
  calls.length = 0;
  vi.mocked(resendRequest).mockImplementation(async (path, options) => {
    calls.push({ path, method: options?.method, body: options?.body });
    if (path.startsWith('/segments/') && path.endsWith('/contacts')) {
      const segmentId = path.split('/')[2];
      return {
        data: segmentId === DIGEST_SEGMENT_PT ? [CONTACT] : [],
      };
    }
    if (path.startsWith('/contact-properties')) {
      return PROPERTY_PAGE;
    }
    if (path === '/broadcasts' && options?.method === 'POST') {
      const segmentId = (options.body as { segment_id: string }).segment_id;
      return { id: segmentId === DIGEST_SEGMENT_PT ? 'draft-pt' : 'draft-en' };
    }
    if (String(path).endsWith('/send')) {
      expect(mockDb.newsletterDispatch.create).toHaveBeenCalled();
    }
    return { id: 'ok' };
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv(RESEND_API_KEY_ENV, 'test-key');
  vi.stubEnv(RESEND_FROM_ENV, DIGEST_FROM);
  vi.stubEnv('SITE_URL', DIGEST_ORIGIN);
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE.en, DIGEST_SEGMENT_EN);
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE['pt-BR'], DIGEST_SEGMENT_PT);
  mockDb.newsletterDispatch.findUnique.mockResolvedValue(null);
  mockDb.newsletterSubscription.findMany.mockResolvedValue([PT_SUBSCRIBER]);
  mockDb.job.findMany.mockResolvedValue([JOB]);
  mockResend();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

it('sends one localized broadcast after storing the lane digest', async () => {
  const count = await sendNewsletter(db, SENT_AT, 0);
  const { digest } = messagesFor('pt-BR').newsletter;
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
    `/contacts/${encodeURIComponent(DIGEST_EMAIL)}`,
    expect.objectContaining({
      method: 'PATCH',
      body: {
        properties: {
          [DIGEST_JOBS_TEXT_PROPERTY]: expect.stringContaining(JOB.title),
          [DIGEST_JOBS_HTML_PROPERTY]: expect.stringContaining('<table'),
          [DIGEST_LANE_URL_PROPERTY]: expect.stringContaining(
            `/pt-BR/jobs?focus=${DIGEST_FOCUS}&country=${DIGEST_COUNTRY}`,
          ),
        },
      },
    }),
  );
  expect(resendRequest).toHaveBeenCalledWith(
    '/broadcasts',
    expect.objectContaining({
      method: 'POST',
      body: expect.objectContaining({
        from: DIGEST_FROM,
        segment_id: DIGEST_SEGMENT_PT,
        subject: digest.subject,
        html: expect.stringMatching(/<table[\s\S]*\n/),
        text: expect.stringContaining(`{{{${DIGEST_JOBS_TEXT_PROPERTY}}}}`),
      }),
    }),
  );
  const broadcast = vi
    .mocked(resendRequest)
    .mock.calls.find((call) => call[0] === '/broadcasts')?.[1]?.body as {
    html: string;
    subject: string;
  };
  expect(broadcast.subject).not.toContain(
    messagesFor('en').newsletter.digest.subject,
  );
  expect(broadcast.html).toContain('{{{RESEND_UNSUBSCRIBE_URL}}}');
  expect(broadcast.html).toContain(digest.unsubscribe);
  expect(broadcast.html).not.toContain(
    messagesFor('en').newsletter.digest.unsubscribe,
  );
  expect(mockDb.newsletterDispatch.create).toHaveBeenCalledWith({
    data: { date: '2026-10-28', broadcastId: 'draft-pt' },
  });
  expect(mockDb.newsletterDispatch.update).toHaveBeenCalledOnce();
});

it('never sends a broadcast to a contact that was not confirmed locally', async () => {
  mockDb.newsletterSubscription.findMany.mockResolvedValueOnce([]);
  await expect(sendNewsletter(db, SENT_AT, 0)).rejects.toThrow(
    'without a confirmed subscription',
  );
  expect(mockDb.newsletterDispatch.create).not.toHaveBeenCalled();
});

it('does not send twice on the same day or broadcast an empty digest', async () => {
  mockDb.newsletterDispatch.findUnique.mockResolvedValueOnce({
    date: '2026-10-28',
  } as never);
  expect(await sendNewsletter(db, SENT_AT, 0)).toBe(0);
  expect(resendRequest).not.toHaveBeenCalled();

  mockDb.job.findMany.mockResolvedValueOnce([]);
  expect(await sendNewsletter(db, new Date('2026-10-29T11:00:00Z'), 0)).toBe(0);
  expect(resendRequest).not.toHaveBeenCalledWith(
    '/broadcasts',
    expect.anything(),
  );
  expect(mockDb.newsletterDispatch.create).not.toHaveBeenCalled();
});

it('sends each language to its own segment and moves a contact first', async () => {
  mockDb.newsletterSubscription.findMany.mockResolvedValue([
    EN_SUBSCRIBER,
    PT_SUBSCRIBER,
  ]);
  vi.mocked(resendRequest).mockImplementation(async (path, options) => {
    calls.push({ path, method: options?.method, body: options?.body });
    if (path === `/segments/${DIGEST_SEGMENT_EN}/contacts`) {
      return {
        data: [{ email: DIGEST_EMAIL_SECOND, unsubscribed: false }, CONTACT],
      };
    }
    if (path === `/segments/${DIGEST_SEGMENT_PT}/contacts`) {
      return { data: [] };
    }
    if (path.startsWith('/contact-properties')) {
      return PROPERTY_PAGE;
    }
    if (path === '/broadcasts' && options?.method === 'POST') {
      const segmentId = (options.body as { segment_id: string }).segment_id;
      return { id: segmentId === DIGEST_SEGMENT_PT ? 'draft-pt' : 'draft-en' };
    }
    return { id: 'ok' };
  });

  expect(await sendNewsletter(db, SENT_AT, 0)).toBe(2);
  const move = calls.findIndex(
    (call) =>
      call.method === 'DELETE' &&
      call.path ===
        `/contacts/${encodeURIComponent(DIGEST_EMAIL)}/segments/${DIGEST_SEGMENT_EN}`,
  );
  const englishBroadcast = calls.findIndex(
    (call) =>
      call.path === '/broadcasts' &&
      (call.body as { segment_id?: string }).segment_id === DIGEST_SEGMENT_EN,
  );
  expect(move).toBeGreaterThanOrEqual(0);
  expect(move).toBeLessThan(englishBroadcast);
  expect(mockDb.newsletterDispatch.create).toHaveBeenCalledWith({
    data: { date: '2026-10-28', broadcastId: 'draft-en,draft-pt' },
  });
});

it('does not send when a Portuguese subscriber has no segment', async () => {
  vi.stubEnv(SEGMENT_ENV_BY_LOCALE['pt-BR'], '');
  vi.mocked(resendRequest).mockImplementation(async (path) =>
    path === `/segments/${DIGEST_SEGMENT_EN}/contacts`
      ? { data: [CONTACT] }
      : { data: [] },
  );
  await expect(sendNewsletter(db, SENT_AT, 0)).rejects.toThrow(
    SEGMENT_ENV_BY_LOCALE['pt-BR'],
  );
  expect(mockDb.newsletterDispatch.create).not.toHaveBeenCalled();
});

it('falls back to English when the stored locale is unknown', async () => {
  mockDb.newsletterSubscription.findMany.mockResolvedValue([
    { ...EN_SUBSCRIBER, locale: 'fr' },
  ]);
  vi.mocked(resendRequest).mockImplementation(async (path, options) => {
    if (path === `/segments/${DIGEST_SEGMENT_EN}/contacts`) {
      return {
        data: [{ email: DIGEST_EMAIL_SECOND, unsubscribed: false }],
      };
    }
    if (path.startsWith('/segments/')) {
      return { data: [] };
    }
    if (path.startsWith('/contact-properties')) {
      return PROPERTY_PAGE;
    }
    return path === '/broadcasts'
      ? { id: 'draft-en' }
      : { id: 'ok', path, options };
  });
  await sendNewsletter(db, SENT_AT, 0);
  expect(resendRequest).toHaveBeenCalledWith(
    '/broadcasts',
    expect.objectContaining({
      body: expect.objectContaining({
        segment_id: DIGEST_SEGMENT_EN,
        subject: messagesFor('en').newsletter.digest.subject,
      }),
    }),
  );
});

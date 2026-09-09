import { connection } from 'next/server';
import { getDb } from '@/lib/db/client';
import { JOB_MAX_AGE_MS, REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import {
  TEST_JOB_ID,
  TEST_REPORT_ERROR_MESSAGE,
} from '@/lib/report/test-fixtures';
import { DEFAULT_SITE_ORIGIN } from '@/lib/seo/constants';
import sitemap from './sitemap';

vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }));
vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

const NOW = new Date('2026-09-09T12:00:00Z');
const JOBS = Array.from({ length: 105 }, (_, index) => ({
  id: TEST_JOB_ID.replace('abcdef12', index.toString(16).padStart(8, '0')),
}));

describe('sitemap', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
    vi.mocked(connection).mockClear();
    vi.mocked(getDb).mockReset();
    vi.stubEnv('SITE_URL', '');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('waits for a real request, lists more than 100 eligible jobs, and selects only IDs without fabricated lastmod', async () => {
    const findMany = vi.fn(async () => JOBS);
    vi.mocked(getDb).mockImplementation(() => {
      expect(connection).toHaveBeenCalledExactlyOnceWith();
      return { job: { findMany } } as unknown as ReturnType<typeof getDb>;
    });

    await expect(sitemap()).resolves.toStrictEqual([
      ...['/', '/jobs', '/about'].map((path) => ({
        url: new URL(path, DEFAULT_SITE_ORIGIN).href,
      })),
      ...JOBS.map(({ id }) => ({ url: `${DEFAULT_SITE_ORIGIN}/jobs/${id}` })),
    ]);
    const cutoff = new Date(NOW.getTime() - JOB_MAX_AGE_MS);
    expect(findMany).toHaveBeenCalledExactlyOnceWith({
      where: {
        isActive: true,
        remotePolicy: REMOTE_POLICY_REMOTE,
        OR: [
          { postedAt: { gte: cutoff } },
          { postedAt: null, firstSeenAt: { gte: cutoff } },
        ],
      },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
  });

  it('does not touch the DB while prerendering is waiting for connection', async () => {
    const prerenderInterrupted = new Error(TEST_REPORT_ERROR_MESSAGE);
    vi.mocked(connection).mockRejectedValueOnce(prerenderInterrupted);
    await expect(sitemap()).rejects.toBe(prerenderInterrupted);
    expect(getDb).not.toHaveBeenCalled();
  });

  it('propagates DB acquisition and query failures instead of publishing an empty success', async () => {
    const error = new Error(TEST_REPORT_ERROR_MESSAGE);
    vi.mocked(getDb).mockImplementationOnce(() => {
      throw error;
    });
    await expect(sitemap()).rejects.toBe(error);
    const findMany = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(JOBS);
    vi.mocked(getDb).mockReturnValue({
      job: { findMany },
    } as unknown as ReturnType<typeof getDb>);
    await expect(sitemap()).rejects.toBe(error);
    await expect(sitemap()).resolves.toHaveLength(JOBS.length + 3);
  });
});

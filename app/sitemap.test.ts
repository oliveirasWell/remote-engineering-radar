import { connection } from 'next/server';
import { getDb } from '@/lib/db/client';
import {
  TEST_JOB_ID,
  TEST_REPORT_ERROR_MESSAGE,
} from '@/lib/report/test-fixtures';
import {
  JOB_COUNTRY_FILTER_OPTIONS,
  JOB_MAX_AGE_MS,
  REMOTE_POLICY_REMOTE,
} from '@/lib/jobs/constants';
import { DEFAULT_SITE_ORIGIN, MIN_INDEXABLE_JOBS } from '@/lib/seo/constants';
import { filterJobCount } from '@/lib/seo/filter-job-count';
import sitemap from './sitemap';

vi.mock('next/server', () => ({ connection: vi.fn(async () => {}) }));
vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));
vi.mock('@/lib/seo/filter-job-count', () => ({
  filterJobCount: vi.fn(async () => 0),
}));

const NOW = new Date('2026-09-09T12:00:00Z');
const LANGUAGE_COUNT = 2;
const PORTUGUESE_PREFIX = '/pt-BR';

/** Both language versions of a page, each listing both as alternates. */
const entriesFor = (path: string) => {
  const english = new URL(path, DEFAULT_SITE_ORIGIN).href;
  const portuguese = new URL(
    path === '/' ? PORTUGUESE_PREFIX : `${PORTUGUESE_PREFIX}${path}`,
    DEFAULT_SITE_ORIGIN,
  ).href;
  const alternates = { languages: { en: english, 'pt-BR': portuguese } };
  return [
    { url: english, alternates },
    { url: portuguese, alternates },
  ];
};
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

    await expect(sitemap()).resolves.toStrictEqual(
      ['/', '/jobs', '/about', ...JOBS.map(({ id }) => `/jobs/${id}`)].flatMap(
        entriesFor,
      ),
    );
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
    await expect(sitemap()).resolves.toHaveLength(
      (JOBS.length + 3) * LANGUAGE_COUNT,
    );
  });

  it('lists the companies and jobs views of every filter with enough jobs', async () => {
    const [brazil] = JOB_COUNTRY_FILTER_OPTIONS;
    vi.mocked(getDb).mockReturnValue({
      job: { findMany: vi.fn(async () => []) },
    } as unknown as ReturnType<typeof getDb>);
    vi.mocked(filterJobCount).mockImplementation(async ({ country }) =>
      country === brazil.slug ? MIN_INDEXABLE_JOBS : MIN_INDEXABLE_JOBS - 1,
    );

    const urls = (await sitemap()).map(({ url }) => url);

    expect(urls).toStrictEqual(
      [
        '/',
        '/pt-BR',
        '/jobs',
        '/pt-BR/jobs',
        '/about',
        '/pt-BR/about',
        `/?country=${brazil.slug}`,
        `/pt-BR?country=${brazil.slug}`,
        `/jobs?country=${brazil.slug}`,
        `/pt-BR/jobs?country=${brazil.slug}`,
      ].map((path) => new URL(path, DEFAULT_SITE_ORIGIN).href),
    );
  });
});

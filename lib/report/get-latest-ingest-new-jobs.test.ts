import { getDb } from '@/lib/db/client';
import { DATABASE_URL_ENV } from '@/lib/db/constants';
import { getLatestIngestNewJobs } from './get-latest-ingest-new-jobs';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

it('returns null without opening a database when none is configured', async () => {
  vi.stubEnv(DATABASE_URL_ENV, '');

  await expect(getLatestIngestNewJobs()).resolves.toBeNull();

  expect(getDb).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});

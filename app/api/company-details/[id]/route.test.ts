import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { GET } from './route';

vi.mock('@/lib/db/client', () => ({ getDb: vi.fn() }));

const URL_BASE = 'http://localhost/api/company-details/';
const EVIDENCE_URL = 'https://example.com/hiring';

it('returns only the requested company and country-eligible job details', async () => {
  const db = await createTestDb();
  vi.mocked(getDb).mockReturnValue(db);
  const companies = createCompaniesRepository(db);
  const jobs = createJobsRepository(db);
  const jobInput = { ...TEST_JOB, technologies: [...TEST_JOB.technologies] };
  const company = await companies.create(TEST_COMPANY);
  const other = await companies.create({
    ...TEST_COMPANY,
    slug: 'other-company',
  });
  const visible = await jobs.create({
    ...jobInput,
    companyId: company.id,
    sourceJobId: 'visible-brazil',
    countries: ['brazil'],
    postedAt: new Date(),
  });
  await jobs.create({
    ...jobInput,
    companyId: company.id,
    sourceJobId: 'excluded-chile',
    countries: ['chile'],
    postedAt: new Date(),
  });
  await jobs.create({
    ...jobInput,
    companyId: other.id,
    sourceJobId: 'excluded-company',
    countries: ['brazil'],
    postedAt: new Date(),
  });
  await createHiringSignalsRepository(db).create({
    companyId: company.id,
    type: 'new_jobs',
    description: 'Recent hiring activity',
    sourceUrl: EVIDENCE_URL,
  });

  const response = await GET(
    new Request(`${URL_BASE}${company.id}?country=brazil`),
    { params: Promise.resolve({ id: company.id }) },
  );

  expect(response.status).toBe(200);
  const payload = await response.json();
  expect(payload).toMatchObject({
    signalDescriptions: ['Recent hiring activity'],
    signalSourceUrls: [EVIDENCE_URL],
    jobs: [{ id: visible.id, companyId: company.id }],
  });
  expect(payload.jobs).toHaveLength(1);
  expect(payload.jobs[0]).not.toHaveProperty('description');
  expect(response.headers.get('cache-control')).toContain('s-maxage=3600');
});

it('rejects malformed IDs without querying the database', async () => {
  vi.mocked(getDb).mockClear();
  const id = 'not-a-uuid';
  const response = await GET(new Request(`${URL_BASE}${id}`), {
    params: Promise.resolve({ id }),
  });

  expect(response.status).toBe(400);
  expect(getDb).not.toHaveBeenCalled();
});

it('returns 404 for a missing company without caching the error', async () => {
  vi.mocked(getDb).mockReturnValue(await createTestDb());
  const id = 'abcdef12-3456-4789-abcd-ef1234567890';
  const response = await GET(new Request(`${URL_BASE}${id}`), {
    params: Promise.resolve({ id }),
  });

  expect(response.status).toBe(404);
  expect(response.headers.get('cache-control')).toBeNull();
});

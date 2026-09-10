import { createCompaniesRepository } from './companies-repository';
import { createJobsRepository } from './jobs-repository';
import { createTestDb } from '../test/create-test-db';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

describe('createCompaniesRepository', () => {
  it('supports create, read, update, and delete', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);

    const created = await companiesRepository.create(TEST_COMPANY);

    expect(created).toMatchObject({
      name: TEST_COMPANY.name,
      slug: TEST_COMPANY.slug,
      websiteUrl: TEST_COMPANY.websiteUrl,
      logoUrl: TEST_COMPANY.logoUrl,
      source: TEST_COMPANY.source,
      hiringScore: TEST_COMPANY.hiringScore,
    });
    expect(created.id).toBeTruthy();

    await expect(companiesRepository.findById(created.id)).resolves.toEqual(
      created,
    );
    await expect(
      companiesRepository.findBySlug(TEST_COMPANY.slug),
    ).resolves.toEqual(created);

    const updated = await companiesRepository.updateHiringScore(created.id, 40);
    expect(updated?.hiringScore).toBe(40);

    await expect(companiesRepository.deleteById(created.id)).resolves.toBe(
      true,
    );
    await expect(companiesRepository.findById(created.id)).resolves.toBeNull();
    await expect(
      companiesRepository.updateHiringScore(created.id, 50),
    ).resolves.toBeNull();
    await expect(companiesRepository.deleteById(created.id)).resolves.toBe(
      false,
    );
  });

  it('uses a strict minimum hiring score', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const jobsRepository = createJobsRepository(db);
    const atMinimum = await companiesRepository.create({
      ...TEST_COMPANY,
      hiringScore: 12,
    });
    const aboveMinimum = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'higher-score',
      hiringScore: 13,
    });

    // Listing only surfaces companies with an active remote job.
    for (const company of [atMinimum, aboveMinimum]) {
      await jobsRepository.create({
        ...TEST_JOB,
        companyId: company.id,
        sourceJobId: `job-${company.slug}`,
        technologies: [...TEST_JOB.technologies],
      });
    }

    await expect(
      companiesRepository.listByHiringScore({ minimumHiringScore: 12 }),
    ).resolves.toMatchObject([{ slug: 'higher-score' }]);
  });

  it('upserts many slugs in one statement, preserving omitted optional fields', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);

    const existing = await companiesRepository.create(TEST_COMPANY);

    const upserted = await companiesRepository.upsertManyBySlug([
      {
        name: 'Acme Robotics Renamed',
        slug: TEST_COMPANY.slug,
        source: 'ashby',
      },
      {
        name: 'Globex',
        slug: 'globex',
        source: 'greenhouse',
        websiteUrl: 'https://globex.example',
      },
    ]);

    expect(new Map(upserted.map(({ slug, id }) => [slug, id]))).toEqual(
      new Map([
        [TEST_COMPANY.slug, existing.id],
        ['globex', expect.any(String)],
      ]),
    );

    // The bulk path must not clobber fields the ingestion input omits.
    await expect(
      companiesRepository.findBySlug(TEST_COMPANY.slug),
    ).resolves.toMatchObject({
      name: 'Acme Robotics Renamed',
      source: 'ashby',
      websiteUrl: TEST_COMPANY.websiteUrl,
      logoUrl: TEST_COMPANY.logoUrl,
      hiringScore: TEST_COMPANY.hiringScore,
    });
    await expect(
      companiesRepository.findBySlug('globex'),
    ).resolves.toMatchObject({
      name: 'Globex',
      websiteUrl: 'https://globex.example',
      hiringScore: 0,
    });
  });

  it('upserts no companies without touching the database', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);

    await expect(companiesRepository.upsertManyBySlug([])).resolves.toEqual([]);
  });
});

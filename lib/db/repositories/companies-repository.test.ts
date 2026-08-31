import { createCompaniesRepository } from './companies-repository';
import { createTestDb } from '../test/create-test-db';
import { TEST_COMPANY } from './test-fixtures';

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

  it('upserts the same slug without creating a duplicate', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);

    const first = await companiesRepository.upsertBySlug(TEST_COMPANY);
    const second = await companiesRepository.upsertBySlug({
      ...TEST_COMPANY,
      name: 'Acme Robotics Updated',
      websiteUrl: undefined,
    });

    expect(second.id).toBe(first.id);
    await expect(
      companiesRepository.findBySlug(TEST_COMPANY.slug),
    ).resolves.toMatchObject({
      name: 'Acme Robotics Updated',
      websiteUrl: TEST_COMPANY.websiteUrl,
    });
  });

  it('preserves every omitted optional field and applies explicit nulls', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);

    const first = await companiesRepository.upsertBySlug(TEST_COMPANY);
    const preserved = await companiesRepository.upsertBySlug({
      name: 'Renamed Company',
      slug: TEST_COMPANY.slug,
      source: 'ashby',
    });

    expect(preserved).toMatchObject({
      id: first.id,
      websiteUrl: TEST_COMPANY.websiteUrl,
      logoUrl: TEST_COMPANY.logoUrl,
      hiringScore: TEST_COMPANY.hiringScore,
    });

    const cleared = await companiesRepository.upsertBySlug({
      name: 'Renamed Company',
      slug: TEST_COMPANY.slug,
      source: 'ashby',
      websiteUrl: null,
      logoUrl: null,
      hiringScore: 0,
    });
    expect(cleared).toMatchObject({
      websiteUrl: null,
      logoUrl: null,
      hiringScore: 0,
    });
  });

  it('uses a strict minimum hiring score', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    await companiesRepository.create({ ...TEST_COMPANY, hiringScore: 12 });
    await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'higher-score',
      hiringScore: 13,
    });

    await expect(
      companiesRepository.listByHiringScore({ minimumHiringScore: 12 }),
    ).resolves.toMatchObject([{ slug: 'higher-score' }]);
  });
});

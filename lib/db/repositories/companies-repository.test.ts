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
});

import { createCompaniesRepository } from './companies-repository';
import { createHiringSignalsRepository } from './hiring-signals-repository';
import { createTestDb } from '../test/create-test-db';
import { TEST_COMPANY, TEST_HIRING_SIGNAL } from './test-fixtures';

describe('createHiringSignalsRepository', () => {
  it('supports create, read, list, and delete', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const hiringSignalsRepository = createHiringSignalsRepository(db);
    const company = await companiesRepository.create(TEST_COMPANY);

    const created = await hiringSignalsRepository.create({
      ...TEST_HIRING_SIGNAL,
      companyId: company.id,
    });

    expect(created).toMatchObject({
      companyId: company.id,
      type: TEST_HIRING_SIGNAL.type,
      description: TEST_HIRING_SIGNAL.description,
      sourceUrl: TEST_HIRING_SIGNAL.sourceUrl,
      score: TEST_HIRING_SIGNAL.score,
    });

    await expect(hiringSignalsRepository.findById(created.id)).resolves.toEqual(
      created,
    );
    await expect(
      hiringSignalsRepository.listByCompanyId(company.id),
    ).resolves.toEqual([created]);

    await expect(hiringSignalsRepository.deleteById(created.id)).resolves.toBe(
      true,
    );
    await expect(
      hiringSignalsRepository.findById(created.id),
    ).resolves.toBeNull();
  });
});

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
    await expect(hiringSignalsRepository.deleteById(created.id)).resolves.toBe(
      false,
    );
  });

  it('replaces signals and hiring scores for many companies at once', async () => {
    const db = await createTestDb();
    const companiesRepository = createCompaniesRepository(db);
    const hiringSignalsRepository = createHiringSignalsRepository(db);
    const first = await companiesRepository.create(TEST_COMPANY);
    const second = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'globex',
      hiringScore: 3,
    });
    const untouched = await companiesRepository.create({
      ...TEST_COMPANY,
      slug: 'initech',
      hiringScore: 7,
    });

    for (const company of [first, second, untouched]) {
      await hiringSignalsRepository.create({
        ...TEST_HIRING_SIGNAL,
        companyId: company.id,
      });
    }

    await hiringSignalsRepository.replaceForCompanies([
      {
        companyId: first.id,
        hiringScore: 40,
        signals: [
          {
            companyId: first.id,
            type: 'RECENT_ENGINEERING_HIRING',
            description: 'Recent engineering hiring detected.',
            sourceUrl: null,
            score: 20,
          },
        ],
      },
      { companyId: second.id, hiringScore: 0, signals: [] },
    ]);

    await expect(
      hiringSignalsRepository.listByCompanyId(first.id),
    ).resolves.toMatchObject([
      { type: 'RECENT_ENGINEERING_HIRING', score: 20, sourceUrl: null },
    ]);
    await expect(
      hiringSignalsRepository.listByCompanyId(second.id),
    ).resolves.toEqual([]);
    await expect(companiesRepository.findById(first.id)).resolves.toMatchObject(
      {
        hiringScore: 40,
      },
    );
    await expect(
      companiesRepository.findById(second.id),
    ).resolves.toMatchObject({ hiringScore: 0 });

    // Companies outside the batch keep their signals and score.
    await expect(
      hiringSignalsRepository.listByCompanyId(untouched.id),
    ).resolves.toHaveLength(1);
    await expect(
      companiesRepository.findById(untouched.id),
    ).resolves.toMatchObject({ hiringScore: 7 });
  });

  it('replaces nothing for an empty batch', async () => {
    const db = await createTestDb();
    const hiringSignalsRepository = createHiringSignalsRepository(db);

    await expect(
      hiringSignalsRepository.replaceForCompanies([]),
    ).resolves.toBeUndefined();
  });
});

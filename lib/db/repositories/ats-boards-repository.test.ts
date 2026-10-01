import { createTestDb } from '../test/create-test-db';
import { createCompaniesRepository } from './companies-repository';
import { createJobsRepository } from './jobs-repository';
import { createAtsBoardsRepository } from './ats-boards-repository';
import { TEST_COMPANY, TEST_JOB } from './test-fixtures';

describe('createAtsBoardsRepository', () => {
  it('ranks aggregator-backed software companies, checks them, and keeps verified board links unique', async () => {
    const db = await createTestDb();
    const repository = createAtsBoardsRepository(db);
    const company = await createCompaniesRepository(db).create(TEST_COMPANY);
    const other = await createCompaniesRepository(db).create({
      ...TEST_COMPANY,
      name: 'Other Company',
      slug: 'other-company',
    });
    const jobs = createJobsRepository(db);
    await jobs.create({
      ...TEST_JOB,
      companyId: company.id,
      source: 'himalayas',
      roleFocus: ['software'],
      technologies: [...TEST_JOB.technologies],
    });
    await jobs.create({
      ...TEST_JOB,
      companyId: other.id,
      source: 'greenhouse',
      sourceJobId: 'only-board',
      roleFocus: ['software'],
      technologies: [...TEST_JOB.technologies],
    });

    const now = new Date('2026-10-01T12:00:00Z');
    expect(
      await repository.listCandidates(new Date(now.getTime() - 30 * 86400000)),
    ).toEqual([{ id: company.id, name: company.name }]);
    expect(await repository.listEvidenceTitles(company.id)).toEqual([
      TEST_JOB.title,
    ]);
    expect(
      await repository.insertVerified('greenhouse', 'acme', company.id),
    ).toBe(true);
    expect(
      await repository.insertVerified('greenhouse', 'acme', other.id),
    ).toBe(false);
    expect(await repository.listVerified()).toMatchObject([
      {
        ats: 'greenhouse',
        slug: 'acme',
        companyId: company.id,
        companyName: company.name,
        softwareCount: 1,
      },
    ]);

    await repository.markChecked(company.id, now);
    expect(
      await repository.listCandidates(new Date(now.getTime() - 30 * 86400000)),
    ).toEqual([]);
    expect(await repository.remove('greenhouse', 'acme')).toBe(true);
    expect(await repository.listVerified()).toEqual([]);
  });
});

import { createTestDb } from '@/lib/db/test/create-test-db';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { createAtsBoardsRepository } from '@/lib/db/repositories/ats-boards-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { asFetch, jsonResponse } from '@/test/http';
import { BOARD_RECHECK_DAYS } from './constants';
import { discoverBoards } from './discover-boards';

const NOW = new Date('2026-10-01T12:00:00Z');
const COMPANY_NAME = 'Grafana Labs';
const BOARD_SLUG = 'grafanalabs';
const MATCHING_TITLE = 'Senior React Engineer';

const setupCompany = async () => {
  const db = await createTestDb();
  const company = await createCompaniesRepository(db).create({
    ...TEST_COMPANY,
    name: COMPANY_NAME,
    slug: 'grafana-labs',
  });
  await createJobsRepository(db).create({
    ...TEST_JOB,
    companyId: company.id,
    source: 'himalayas',
    title: MATCHING_TITLE,
    roleFocus: ['software'],
    technologies: [...TEST_JOB.technologies],
  });
  return { db, company, repository: createAtsBoardsRepository(db) };
};

const greenhouseResponse = (title: string) =>
  jsonResponse({
    jobs: [
      {
        id: 123,
        title,
        absolute_url: 'https://boards.greenhouse.io/grafanalabs/jobs/123',
      },
    ],
  });

describe('discoverBoards', () => {
  it('stores a title-verified board, including a seed board, and checks the company', async () => {
    const { db, company, repository } = await setupCompany();
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      expect(String(input)).toContain(BOARD_SLUG);
      return greenhouseResponse(MATCHING_TITLE);
    });

    const result = await discoverBoards({
      db,
      now: NOW,
      fetch: asFetch(fetchMock),
      delayMs: 0,
    });

    expect(result).toEqual({ checked: 1, verified: 1 });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(await repository.listVerified()).toMatchObject([
      { ats: 'greenhouse', slug: BOARD_SLUG, companyId: company.id },
    ]);
    expect(
      (await db.company.findUnique({ where: { id: company.id } }))
        ?.boardCheckedAt,
    ).toEqual(NOW);
    expect(
      await repository.listCandidates(
        new Date(NOW.getTime() - BOARD_RECHECK_DAYS * 86400000),
      ),
    ).toEqual([]);
  });

  it('rejects a homonym board with unrelated titles and still marks the company checked', async () => {
    const { db, company, repository } = await setupCompany();
    const fetchMock = vi.fn(async () =>
      greenhouseResponse('Sales Representative'),
    );

    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(fetchMock),
        delayMs: 0,
      }),
    ).toEqual({ checked: 1, verified: 0 });
    expect(await repository.listVerified()).toEqual([]);
    expect(
      (await db.company.findUnique({ where: { id: company.id } }))
        ?.boardCheckedAt,
    ).toEqual(NOW);
  });

  it('does not store a board when every ATS returns 404', async () => {
    const { db, repository } = await setupCompany();
    const fetchMock = vi.fn(async () => jsonResponse({}, 404));

    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(fetchMock),
        delayMs: 0,
      }),
    ).toEqual({ checked: 1, verified: 0 });
    expect(fetchMock).toHaveBeenCalled();
    expect(await repository.listVerified()).toEqual([]);
  });

  it('does not insert an already verified seed board twice', async () => {
    const { db, company, repository } = await setupCompany();
    await repository.insertVerified('greenhouse', BOARD_SLUG, company.id);

    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(async () => greenhouseResponse(MATCHING_TITLE)),
        delayMs: 0,
      }),
    ).toEqual({ checked: 1, verified: 0 });
    expect(await repository.listVerified()).toHaveLength(1);
  });

  it('marks a company checked after a throwing probe', async () => {
    const { db, company, repository } = await setupCompany();
    const failedFetch = asFetch(async () => {
      throw new Error('network unavailable');
    });

    expect(
      await discoverBoards({ db, now: NOW, fetch: failedFetch, delayMs: 0 }),
    ).toEqual({ checked: 1, verified: 0 });
    expect(await repository.listVerified()).toEqual([]);
    expect(
      (await db.company.findUnique({ where: { id: company.id } }))
        ?.boardCheckedAt,
    ).toEqual(NOW);
  });

  it('skips recent checks, retries an old check, and honors an exhausted budget', async () => {
    const { db, company, repository } = await setupCompany();
    const fetchMock = vi.fn(async () => greenhouseResponse(MATCHING_TITLE));
    await repository.markChecked(
      company.id,
      new Date(NOW.getTime() - 29 * 86400000),
    );
    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(fetchMock),
        delayMs: 0,
      }),
    ).toEqual({ checked: 0, verified: 0 });
    await repository.markChecked(
      company.id,
      new Date(NOW.getTime() - 31 * 86400000),
    );
    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(fetchMock),
        delayMs: 0,
        budgetMs: 0,
      }),
    ).toEqual({ checked: 0, verified: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(fetchMock),
        delayMs: 0,
      }),
    ).toEqual({ checked: 1, verified: 1 });
  });

  it('does not verify a board using jobs only held from that board', async () => {
    const db = await createTestDb();
    const company = await createCompaniesRepository(db).create({
      ...TEST_COMPANY,
      name: COMPANY_NAME,
      slug: 'grafana-labs',
    });
    await createJobsRepository(db).create({
      ...TEST_JOB,
      companyId: company.id,
      source: 'greenhouse',
      title: MATCHING_TITLE,
      roleFocus: ['software'],
      technologies: [...TEST_JOB.technologies],
    });
    const fetchMock = vi.fn(async () => greenhouseResponse(MATCHING_TITLE));

    expect(
      await discoverBoards({
        db,
        now: NOW,
        fetch: asFetch(fetchMock),
        delayMs: 0,
      }),
    ).toEqual({ checked: 0, verified: 0 });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

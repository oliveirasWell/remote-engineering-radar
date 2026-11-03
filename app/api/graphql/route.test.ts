import { TEST_REPORT_JOB } from '@/components/report/test-fixtures';
import { JOBS_PAGE_LIMIT } from '@/app/[lang]/jobs/constants';
import { parseJobFilters } from '@/app/[lang]/jobs/parse-job-filters';
import {
  getJobDetailData,
  getJobsPageData,
} from '@/lib/report/get-jobs-page-data';
import { GRAPHQL_ENDPOINT } from './constants';
import { POST } from './route';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(),
  getJobDetailData: vi.fn(),
}));

const TOKEN = 'test-radar-api-token';
const WRONG_TOKEN = 'wrong-radar-api-token';
const JOB_ID = '00000000-0000-4000-8000-00000000000a';
const UNKNOWN_JOB_ID = '00000000-0000-4000-8000-000000000099';
const INVALID_JOB_ID = 'not-a-uuid';
const UNKNOWN_TECHNOLOGY = 'Cobol';

const JOB_FIELDS = `
  id
  title
  url
  location
  remotePolicy
  technologies
  seniority
  score
  postedAt
  company { id name slug websiteUrl logoUrl }
`;
const JOBS_QUERY = `query Jobs($filter: JobFilter, $first: Int) {
  jobs(filter: $filter, first: $first) { ${JOB_FIELDS} }
}`;
const JOB_IDS_QUERY = `query Jobs($first: Int) { jobs(first: $first) { id } }`;
const JOB_QUERY = `query Job($id: ID!) { job(id: $id) { ${JOB_FIELDS} } }`;
const CLICK_COUNT_QUERY = `{ jobs { id clickCount } }`;

const EXPECTED_JOB = {
  id: TEST_REPORT_JOB.id,
  title: TEST_REPORT_JOB.title,
  url: TEST_REPORT_JOB.url,
  location: TEST_REPORT_JOB.location,
  remotePolicy: TEST_REPORT_JOB.remotePolicy,
  technologies: TEST_REPORT_JOB.technologies,
  seniority: TEST_REPORT_JOB.seniority,
  score: TEST_REPORT_JOB.score,
  postedAt: TEST_REPORT_JOB.postedAt.toISOString(),
  company: TEST_REPORT_JOB.company,
};

const jobWithId = (index: number) => ({
  ...TEST_REPORT_JOB,
  id: `job-${index}`,
});

const postGraphql = (
  body: { query: string; variables?: Record<string, unknown> },
  authorization: string | null = `Bearer ${TOKEN}`,
) =>
  POST(
    new Request(`http://localhost${GRAPHQL_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(authorization === null ? {} : { authorization }),
      },
      body: JSON.stringify(body),
    }),
  );

beforeEach(() => {
  vi.stubEnv('RADAR_API_TOKEN', TOKEN);
  vi.mocked(getJobsPageData)
    .mockReset()
    .mockResolvedValue({ jobs: [TEST_REPORT_JOB] });
  vi.mocked(getJobDetailData)
    .mockReset()
    .mockResolvedValue({ job: { ...TEST_REPORT_JOB, id: JOB_ID } });
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('POST /api/graphql', () => {
  it.each([
    { case: 'no authorization header', authorization: null },
    { case: 'a wrong token', authorization: `Bearer ${WRONG_TOKEN}` },
    { case: 'a non-bearer scheme', authorization: `Basic ${TOKEN}` },
    { case: 'an empty bearer token', authorization: 'Bearer ' },
  ])('returns 401 for $case', async ({ authorization }) => {
    const response = await postGraphql({ query: JOBS_QUERY }, authorization);

    expect(response.status).toBe(401);
    expect(response.headers.get('www-authenticate')).toBe('Bearer');
    expect(getJobsPageData).not.toHaveBeenCalled();
  });

  it('returns 401 when the server token is unset', async () => {
    vi.stubEnv('RADAR_API_TOKEN', '');

    const response = await postGraphql({ query: JOBS_QUERY });

    expect(response.status).toBe(401);
    expect(getJobsPageData).not.toHaveBeenCalled();
  });

  it('returns the public job shape', async () => {
    const response = await postGraphql({ query: JOBS_QUERY });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toStrictEqual({
      data: { jobs: [EXPECTED_JOB] },
    });
    expect(getJobsPageData).toHaveBeenCalledExactlyOnceWith(
      parseJobFilters({}),
    );
  });

  it.each([
    { first: undefined, count: 20 },
    { first: 2, count: 2 },
    { first: 0, count: 1 },
    { first: -5, count: 1 },
    { first: JOBS_PAGE_LIMIT + 1, count: JOBS_PAGE_LIMIT },
  ])('clamps first=$first to $count jobs', async ({ first, count }) => {
    vi.mocked(getJobsPageData).mockResolvedValue({
      jobs: Array.from({ length: JOBS_PAGE_LIMIT }, (_, index) =>
        jobWithId(index),
      ),
    });

    const response = await postGraphql({
      query: JOB_IDS_QUERY,
      variables: { first },
    });

    const body = (await response.json()) as { data: { jobs: unknown[] } };
    expect(body.data.jobs).toHaveLength(count);
    expect(getJobsPageData).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ limit: JOBS_PAGE_LIMIT }),
    );
  });

  it('drops an unknown filter value and validates known ones', async () => {
    await postGraphql({
      query: JOBS_QUERY,
      variables: {
        filter: {
          technology: UNKNOWN_TECHNOLOGY,
          seniority: TEST_REPORT_JOB.seniority,
          minimumScore: TEST_REPORT_JOB.score,
        },
      },
    });

    expect(getJobsPageData).toHaveBeenCalledExactlyOnceWith(
      parseJobFilters({
        seniority: TEST_REPORT_JOB.seniority,
        minimumScore: String(TEST_REPORT_JOB.score),
      }),
    );
  });

  it('rejects a field the public pages do not render', async () => {
    const response = await postGraphql({ query: CLICK_COUNT_QUERY });

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty('data');
    expect(body.errors).toEqual([
      expect.objectContaining({
        message: expect.stringContaining('clickCount'),
      }),
    ]);
    expect(getJobsPageData).not.toHaveBeenCalled();
  });

  it('returns one job by id', async () => {
    const response = await postGraphql({
      query: JOB_QUERY,
      variables: { id: JOB_ID.toUpperCase() },
    });

    await expect(response.json()).resolves.toStrictEqual({
      data: { job: { ...EXPECTED_JOB, id: JOB_ID } },
    });
    expect(getJobDetailData).toHaveBeenCalledExactlyOnceWith(JOB_ID);
  });

  it('returns null for an unknown job id', async () => {
    vi.mocked(getJobDetailData).mockResolvedValue({ job: null });

    const response = await postGraphql({
      query: JOB_QUERY,
      variables: { id: UNKNOWN_JOB_ID },
    });

    await expect(response.json()).resolves.toStrictEqual({
      data: { job: null },
    });
    expect(getJobDetailData).toHaveBeenCalledExactlyOnceWith(UNKNOWN_JOB_ID);
  });

  it('returns null for an invalid job id without reading data', async () => {
    const response = await postGraphql({
      query: JOB_QUERY,
      variables: { id: INVALID_JOB_ID },
    });

    await expect(response.json()).resolves.toStrictEqual({
      data: { job: null },
    });
    expect(getJobDetailData).not.toHaveBeenCalled();
  });
});

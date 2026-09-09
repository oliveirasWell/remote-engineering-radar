// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import { getJobDetailData } from '@/lib/report/get-jobs-page-data';
import {
  TEST_JOB_ID,
  TEST_REPORT_ERROR_MESSAGE,
} from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import { JOBS_PAGE_COPY } from '../constants';
import JobDetailPage from './page';

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobDetailData: vi.fn(),
}));

const MALFORMED_IDS = [
  '',
  'not-a-uuid',
  `${TEST_JOB_ID}extra`,
  ` ${TEST_JOB_ID} `,
  TEST_JOB_ID.replace('-4789-', '-0789-'),
  TEST_JOB_ID.replace('-4789-', '-6789-'),
  TEST_JOB_ID.replace('-4789-', '-7789-'),
  TEST_JOB_ID.replace('-abcd-', '-cbcd-'),
];

describe('JobDetailPage cache boundary', () => {
  beforeEach(() => {
    vi.mocked(getJobDetailData).mockReset().mockResolvedValue({ job: null });
  });

  it.each(MALFORMED_IDS)(
    'renders not found without calling the reader for malformed id %j',
    async (id) => {
      render(
        await resolvePageSection(
          JobDetailPage({ params: Promise.resolve({ id }) }),
        ),
      );

      expect(screen.getByText(JOBS_PAGE_COPY.notFound)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(getJobDetailData).not.toHaveBeenCalled();
    },
  );

  it.each([1, 2, 3, 4, 5])(
    'lowercases valid version %i UUIDs before looking up even unknown jobs',
    async (version) => {
      const id = TEST_JOB_ID.replace('-4789-', `-${version}789-`);
      render(
        await resolvePageSection(
          JobDetailPage({ params: Promise.resolve({ id: id.toUpperCase() }) }),
        ),
      );

      expect(getJobDetailData).toHaveBeenCalledExactlyOnceWith(id);
      expect(screen.getByText(JOBS_PAGE_COPY.notFound)).toBeInTheDocument();
    },
  );

  it('shows only a generic alert on failure and recovers on the next invocation', async () => {
    const props = { params: Promise.resolve({ id: TEST_JOB_ID }) };
    vi.mocked(getJobDetailData)
      .mockRejectedValueOnce(new Error(TEST_REPORT_ERROR_MESSAGE))
      .mockResolvedValueOnce({
        job: {
          ...TEST_JOB,
          id: TEST_JOB_ID,
          companyId: TEST_COMPANY.slug,
          companyName: TEST_COMPANY.name,
          technologies: [...TEST_JOB.technologies],
          postedAt: null,
          reasons: [],
        },
      });

    const section = resolvePageSection(JobDetailPage(props));
    await expect(section).resolves.toBeDefined();
    const { rerender } = render(await section);

    expect(screen.getByRole('alert').textContent).toBe(REPORT_ERROR_MESSAGE);
    expect(screen.queryByText(JOBS_PAGE_COPY.notFound)).not.toBeInTheDocument();
    expect(screen.queryByText(TEST_JOB.title)).not.toBeInTheDocument();

    rerender(await resolvePageSection(JobDetailPage(props)));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: TEST_JOB.title }),
    ).toBeInTheDocument();
    expect(vi.mocked(getJobDetailData).mock.calls).toStrictEqual([
      [TEST_JOB_ID],
      [TEST_JOB_ID],
    ]);
  });
});

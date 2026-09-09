// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { TEST_REPORT_JOB } from '@/components/report/test-fixtures';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import { getJobDetailData } from '@/lib/report/get-jobs-page-data';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import {
  TEST_JOB_ID,
  TEST_REPORT_ERROR_MESSAGE,
} from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import { JOBS_PAGE_COPY } from '../constants';
import JobDetailPage from './page';

const detailJob = { ...TEST_REPORT_JOB, id: TEST_JOB_ID };

const GENERATED_REASONS = [
  { source: 'Senior', translated: 'Sênior' },
  { source: 'Staff', translated: 'Staff' },
  { source: 'Mid-level', translated: 'Pleno' },
  { source: 'Junior', translated: 'Júnior' },
  { source: 'Frontend', translated: 'Frontend' },
  { source: 'Fullstack', translated: 'Fullstack' },
  { source: 'Remote', translated: 'Remoto' },
  { source: 'On-site only', translated: 'Somente presencial' },
  { source: 'Brazil', translated: 'Brasil' },
  { source: 'LATAM', translated: 'América Latina' },
  { source: 'Americas', translated: 'Américas' },
  {
    source: 'Relocation required',
    translated: 'Mudança de cidade ou país obrigatória',
  },
  { source: 'Unrelated stack', translated: 'Tecnologias fora do foco' },
  { source: 'Unrelated role', translated: 'Cargo fora do foco' },
];

vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobDetailData: vi.fn(),
}));

afterEach(() => {
  document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
});

describe('JobDetailPage translation', () => {
  it('translates known generated reasons while preserving technology names and unknown text', async () => {
    document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
    const unchangedReasons = [...detailJob.technologies, ...detailJob.reasons];
    const reasons = [
      ...GENERATED_REASONS.map(({ source }) => source),
      ...unchangedReasons,
    ];
    vi.mocked(getJobDetailData).mockResolvedValue({
      job: { ...detailJob, reasons },
    });
    const page = JobDetailPage({
      params: Promise.resolve({ id: detailJob.id }),
    });
    render(<I18nProvider>{await resolvePageSection(page)}</I18nProvider>);
    const list = within(screen.getByRole('list'));
    expect(
      list.getAllByRole('listitem').map(({ textContent }) => textContent),
    ).toEqual([
      ...GENERATED_REASONS.map(({ translated }) => translated),
      ...unchangedReasons,
    ]);
  });

  it.each([
    { data: { job: null }, hasError: true },
    { data: { job: null }, hasError: false },
    { data: { job: detailJob }, hasError: false },
  ])(
    'translates the detail state without altering original content',
    async ({ data, hasError }) => {
      const { jobs, report } = messagesFor('pt-BR');
      document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
      if (hasError) {
        vi.mocked(getJobDetailData).mockRejectedValueOnce(
          new Error(TEST_REPORT_ERROR_MESSAGE),
        );
      } else {
        vi.mocked(getJobDetailData).mockResolvedValue(data);
      }
      const page = JobDetailPage({
        params: Promise.resolve({ id: detailJob.id }),
      });
      render(<I18nProvider>{await resolvePageSection(page)}</I18nProvider>);
      expect(
        screen.getByRole('link', { name: jobs.backToJobs }),
      ).toHaveAttribute('href', '/jobs');
      if (hasError) {
        expect(screen.getByRole('alert')).toHaveTextContent(report.error);
        expect(
          screen.queryByText(TEST_REPORT_ERROR_MESSAGE),
        ).not.toBeInTheDocument();
      } else if (!data.job) {
        expect(screen.getByText(jobs.notFound)).toBeInTheDocument();
      } else {
        expect(
          screen.getByRole('heading', { level: 1, name: data.job.title }),
        ).toBeInTheDocument();
        expect(screen.getByText(jobs.whyRelevant)).toBeInTheDocument();
        for (const reason of data.job.reasons) {
          expect(screen.getByText(reason)).toBeInTheDocument();
        }
      }
      expect(getJobDetailData).toHaveBeenLastCalledWith(detailJob.id);
    },
  );
});

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

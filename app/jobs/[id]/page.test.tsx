// @vitest-environment jsdom

import { render, screen, within } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { TEST_REPORT_JOB } from '@/components/report/test-fixtures';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';
import { REPORT_ERROR_MESSAGE } from '@/lib/report/constants';
import { getJobDetailData } from '@/lib/report/get-jobs-page-data';
import JobDetailPage from './page';

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
    const unchangedReasons = [
      ...TEST_REPORT_JOB.technologies,
      ...TEST_REPORT_JOB.reasons,
    ];
    const reasons = [
      ...GENERATED_REASONS.map(({ source }) => source),
      ...unchangedReasons,
    ];
    vi.mocked(getJobDetailData).mockResolvedValue({
      job: { ...TEST_REPORT_JOB, reasons },
    });
    const page = JobDetailPage({
      params: Promise.resolve({ id: TEST_REPORT_JOB.id }),
    });
    const section = page.props.children[1].props.children as ReactElement<
      Parameters<typeof JobDetailPage>[0],
      (props: Parameters<typeof JobDetailPage>[0]) => Promise<ReactNode>
    >;
    render(<I18nProvider>{await section.type(section.props)}</I18nProvider>);
    const list = within(screen.getByRole('list'));
    expect(
      list.getAllByRole('listitem').map(({ textContent }) => textContent),
    ).toEqual([
      ...GENERATED_REASONS.map(({ translated }) => translated),
      ...unchangedReasons,
    ]);
  });

  it.each([
    { job: null, errorMessage: REPORT_ERROR_MESSAGE },
    { job: null },
    { job: TEST_REPORT_JOB },
  ])(
    'translates the detail state without altering original content',
    async (data) => {
      const { jobs, report } = messagesFor('pt-BR');
      document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
      vi.mocked(getJobDetailData).mockResolvedValue(data);
      const page = JobDetailPage({
        params: Promise.resolve({ id: TEST_REPORT_JOB.id }),
      });
      const section = page.props.children[1].props.children as ReactElement<
        Parameters<typeof JobDetailPage>[0],
        (props: Parameters<typeof JobDetailPage>[0]) => Promise<ReactNode>
      >;
      render(
        <I18nProvider>
          {page.props.children[0]}
          {await section.type(section.props)}
        </I18nProvider>,
      );
      expect(
        screen.getByRole('link', { name: jobs.backToJobs }),
      ).toHaveAttribute('href', '/jobs');
      if (data.errorMessage) {
        expect(screen.getByRole('alert')).toHaveTextContent(report.error);
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
      expect(getJobDetailData).toHaveBeenLastCalledWith(TEST_REPORT_JOB.id);
    },
  );
});

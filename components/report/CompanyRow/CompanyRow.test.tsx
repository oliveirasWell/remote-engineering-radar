// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import {
  TEST_REPORT_COMPANY,
  TEST_REPORT_JOB,
} from '@/components/report/test-fixtures';
import { messagesFor } from '@/lib/i18n/messages';
import { COMPANY_DETAILS_API_PATH } from '@/lib/report/constants';
import { CompanyRow } from './CompanyRow';
import { HOVER_PREFETCH_DELAY_MS } from './constants';

const company = {
  ...TEST_REPORT_COMPANY,
  jobs: [],
  signalDescriptions: [],
  signalSourceUrls: [],
  detailsLoaded: false as const,
};
const signalDescription = TEST_REPORT_COMPANY.signalDescriptions[0];
const detailsResponse = {
  signalDescriptions: [signalDescription],
  signalSourceUrls: [],
  jobs: [TEST_REPORT_JOB],
};

const renderRow = (id: string) => {
  render(
    <I18nProvider>
      <CompanyRow
        company={{ ...company, id }}
        updatedAt={null}
        allJobsHref="/jobs?company=acme-robotics"
      />
    </I18nProvider>,
  );
  const summary = screen.getByText(company.name).closest('summary')!;
  const row = summary.closest('details')!;
  return { summary, row };
};

afterEach(() => vi.unstubAllGlobals());

it('prefetches on hover and reuses the result when the row opens', async () => {
  const request = vi.fn(async () => Response.json(detailsResponse));
  vi.stubGlobal('fetch', request);
  const { summary, row } = renderRow('hover-company');

  expect(screen.queryByText(signalDescription)).not.toBeInTheDocument();
  expect(request).not.toHaveBeenCalled();

  fireEvent.pointerEnter(summary);
  await waitFor(() => expect(request).toHaveBeenCalledOnce());
  expect(request).toHaveBeenCalledWith(
    `${COMPANY_DETAILS_API_PATH}/hover-company`,
  );

  row.open = true;
  fireEvent(row, new Event('toggle', { bubbles: true }));
  expect(await screen.findByText(signalDescription)).toBeInTheDocument();
  expect(screen.getByText(TEST_REPORT_JOB.title)).toBeInTheDocument();
  expect(request).toHaveBeenCalledOnce();
});

it('loads on touch opening and retries a failed detail request', async () => {
  const request = vi
    .fn()
    .mockResolvedValueOnce(new Response(null, { status: 500 }))
    .mockResolvedValueOnce(Response.json(detailsResponse));
  vi.stubGlobal('fetch', request);
  const { row } = renderRow('touch-company');

  row.open = true;
  fireEvent(row, new Event('toggle', { bubbles: true }));
  expect(await screen.findByRole('alert')).toHaveTextContent(
    messagesFor('en').report.detailsError,
  );
  fireEvent.click(
    screen.getByRole('button', { name: messagesFor('en').globalError.retry }),
  );
  expect(await screen.findByText(signalDescription)).toBeInTheDocument();
  expect(request).toHaveBeenCalledTimes(2);
});

it('cancels incidental pointer hover but prefetches when the summary receives keyboard focus', async () => {
  const request = vi.fn(async () => Response.json(detailsResponse));
  vi.stubGlobal('fetch', request);
  const { summary } = renderRow('focus-company');

  fireEvent.pointerEnter(summary);
  fireEvent.pointerLeave(summary);
  await new Promise((resolve) =>
    setTimeout(resolve, HOVER_PREFETCH_DELAY_MS + 30),
  );
  expect(request).not.toHaveBeenCalled();

  fireEvent.focus(summary);
  await waitFor(() => expect(request).toHaveBeenCalledOnce());
});

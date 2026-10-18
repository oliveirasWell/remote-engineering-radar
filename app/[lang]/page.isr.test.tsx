// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import {
  TEST_REPORT_COMPANY,
  TEST_REPORT_JOB,
} from '@/components/report/test-fixtures';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { EN_MESSAGES } from '@/lib/i18n/messages';
import { EN_ROUTE_PARAMS } from './i18n-fixtures';
import Home, { generateMetadata } from './page';

vi.mock('@/lib/report/get-companies-page-data', () => ({
  getCompaniesPageData: vi.fn(),
}));

it('renders the unfiltered home and its canonical metadata without request search parameters', async () => {
  vi.mocked(getCompaniesPageData).mockResolvedValueOnce({
    companies: [
      {
        ...TEST_REPORT_COMPANY,
        jobs: [TEST_REPORT_JOB],
        signalSourceUrls: [],
        detailsLoaded: false,
      },
    ],
    updatedAt: null,
  });

  render(<I18nProvider>{await Home()}</I18nProvider>);

  expect(
    screen.getByText(TEST_REPORT_COMPANY.name, { selector: 'summary span' }),
  ).toBeInTheDocument();
  expect(screen.queryByText(TEST_REPORT_JOB.title)).not.toBeInTheDocument();
  expect(
    screen.queryByText(TEST_REPORT_COMPANY.signalDescriptions[0]),
  ).not.toBeInTheDocument();
  expect(getCompaniesPageData).toHaveBeenCalledExactlyOnceWith({
    includeDetails: false,
  });
  await expect(
    generateMetadata({ params: EN_ROUTE_PARAMS }),
  ).resolves.toMatchObject({
    title: EN_MESSAGES.seo.homeTitle,
    alternates: { canonical: '/' },
  });
});

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { TEST_REPORT_COMPANY } from '@/components/report/test-fixtures';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { EN_MESSAGES } from '@/lib/i18n/messages';
import { EN_ROUTE_PARAMS } from './i18n-fixtures';
import Home, { generateMetadata } from './page';

vi.mock('@/lib/report/get-companies-page-data', () => ({
  getCompaniesPageData: vi.fn(),
}));

it('renders the unfiltered home and its canonical metadata without request search parameters', async () => {
  vi.mocked(getCompaniesPageData).mockResolvedValueOnce({
    companies: [{ ...TEST_REPORT_COMPANY, jobs: [], signalSourceUrls: [] }],
    updatedAt: null,
  });

  render(
    <I18nProvider>{await Reflect.apply(Home, undefined, [])}</I18nProvider>,
  );

  expect(screen.getByText(TEST_REPORT_COMPANY.name)).toBeInTheDocument();
  expect(getCompaniesPageData).toHaveBeenCalledExactlyOnceWith();
  await expect(
    Reflect.apply(generateMetadata, undefined, [{ params: EN_ROUTE_PARAMS }]),
  ).resolves.toMatchObject({
    title: EN_MESSAGES.seo.homeTitle,
    alternates: { canonical: '/' },
  });
});

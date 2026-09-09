// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { JOB_COUNTRY_FILTER_OPTIONS } from '@/lib/jobs/constants';
import {
  EMPTY_COMPANIES_MESSAGE,
  REPORT_ERROR_MESSAGE,
} from '@/lib/report/constants';
import { formatUpdatedLabel } from '@/lib/report/format';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { TEST_REPORT_ERROR_MESSAGE } from '@/lib/report/test-fixtures';
import { resolvePageSection } from '@/test/render-helpers/resolve-page-section';
import { APP_DESCRIPTION, APP_NAME, FOCUS_TECHNOLOGIES } from './constants';
import { HOME_SECTIONS } from './home-constants';
import Home from './page';

vi.mock('@/lib/report/get-companies-page-data', () => ({
  getCompaniesPageData: vi.fn(),
}));

const UNKNOWN_COUNTRIES = ['atlantis', 'unknown-country'];
const UPDATED_AT = new Date('2026-09-01T12:00:00Z');

describe('home report copy', () => {
  it('exposes brand and section titles for the public report', () => {
    expect(APP_NAME).toBe('Remote Engineering Radar');
    expect(HOME_SECTIONS.companiesToWatch).toBe('Companies to watch');
    expect(HOME_SECTIONS.countryAll).toBe('All countries');
    expect(formatUpdatedLabel(null)).toBe('Updated: —');
  });

  it('names React and the other focus technologies for SEO visitors', () => {
    for (const technology of FOCUS_TECHNOLOGIES) {
      expect(APP_DESCRIPTION).toContain(technology);
      expect(HOME_SECTIONS.subtitle).toContain(technology);
    }
  });
});

describe('Home cache boundary', () => {
  beforeEach(() => {
    vi.mocked(getCompaniesPageData)
      .mockReset()
      .mockResolvedValue({ companies: [], updatedAt: null });
  });

  it('passes the same argument shape and renders the same result for unknown and absent countries', async () => {
    const { container, rerender } = render(
      await resolvePageSection(Home({ searchParams: Promise.resolve({}) })),
    );
    const unfilteredHtml = container.innerHTML;

    for (const country of [
      ...UNKNOWN_COUNTRIES,
      '',
      '   ',
      JOB_COUNTRY_FILTER_OPTIONS.map((option) => option.slug),
    ]) {
      rerender(
        await resolvePageSection(
          Home({ searchParams: Promise.resolve({ country }) }),
        ),
      );
      expect(container.innerHTML).toBe(unfilteredHtml);
    }

    expect(vi.mocked(getCompaniesPageData).mock.calls).toStrictEqual(
      Array.from({ length: 6 }, () => [{ country: undefined }]),
    );
  });

  it.each(JOB_COUNTRY_FILTER_OPTIONS)(
    'canonicalizes $label before calling the reader',
    async ({ slug }) => {
      await resolvePageSection(
        Home({
          searchParams: Promise.resolve({ country: ` ${slug.toUpperCase()} ` }),
        }),
      );

      expect(getCompaniesPageData).toHaveBeenCalledExactlyOnceWith({
        country: slug,
      });
    },
  );

  it('shows a generic error and empty state, preserves country, and recovers on the next invocation', async () => {
    const country = JOB_COUNTRY_FILTER_OPTIONS[0];
    const props = {
      searchParams: Promise.resolve({ country: country.slug }),
    };
    vi.mocked(getCompaniesPageData)
      .mockRejectedValueOnce(new Error(TEST_REPORT_ERROR_MESSAGE))
      .mockResolvedValueOnce({
        companies: [],
        country: country.slug,
        updatedAt: UPDATED_AT,
      });

    const section = resolvePageSection(Home(props));
    await expect(section).resolves.toBeDefined();
    const { rerender } = render(await section);

    expect(screen.getByRole('alert').textContent).toBe(REPORT_ERROR_MESSAGE);
    expect(screen.getByText(EMPTY_COMPANIES_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText(formatUpdatedLabel(null))).toBeInTheDocument();
    expect(screen.getByRole('link', { name: country.label })).toHaveClass(
      'text-foreground',
    );

    rerender(await resolvePageSection(Home(props)));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByText(formatUpdatedLabel(UPDATED_AT)),
    ).toBeInTheDocument();
    expect(vi.mocked(getCompaniesPageData).mock.calls).toStrictEqual([
      [{ country: country.slug }],
      [{ country: country.slug }],
    ]);
  });
});

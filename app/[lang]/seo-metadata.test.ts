import { EN_ROUTE_PARAMS, I18N_TEST, PT_ROUTE_PARAMS } from './i18n-fixtures';
import { EN_MESSAGES, messagesFor } from '@/lib/i18n/messages';
import {
  JOB_COUNTRY_FILTER_OPTIONS,
  JOB_FOCUS_PRODUCT,
} from '@/lib/jobs/constants';
import { getCompaniesPageData } from '@/lib/report/get-companies-page-data';
import { getJobsPageData } from '@/lib/report/get-jobs-page-data';
import { MIN_INDEXABLE_JOBS } from '@/lib/seo/constants';
import { filterJobCount } from '@/lib/seo/filter-job-count';
import { generateMetadata as homeMetadata } from './page';
import { generateMetadata as jobsMetadata } from './jobs/page';

vi.mock('@/lib/report/get-companies-page-data', () => ({
  getCompaniesPageData: vi.fn(async () => ({ companies: [], updatedAt: null })),
}));
vi.mock('@/lib/report/get-jobs-page-data', () => ({
  getJobsPageData: vi.fn(async () => ({ jobs: [] })),
}));
vi.mock('@/lib/seo/filter-job-count', () => ({ filterJobCount: vi.fn() }));

const [BRAZIL] = JOB_COUNTRY_FILTER_OPTIONS;
const { seo, countries, focus } = EN_MESSAGES;

beforeEach(() => {
  vi.mocked(getCompaniesPageData).mockClear();
  vi.mocked(getJobsPageData).mockClear();
  vi.mocked(filterJobCount).mockReset().mockResolvedValue(MIN_INDEXABLE_JOBS);
});

describe('search metadata', () => {
  it('titles the unfiltered pages by what the radar covers', async () => {
    await expect(
      homeMetadata({
        params: EN_ROUTE_PARAMS,
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      title: seo.homeTitle,
      robots: { index: true },
    });
    await expect(
      jobsMetadata({
        params: EN_ROUTE_PARAMS,
        searchParams: Promise.resolve({}),
      }),
    ).resolves.toMatchObject({
      title: EN_MESSAGES.jobs.metaTitle,
      robots: { index: true },
    });
  });

  it('indexes a single country filter that has enough jobs, under its own title', async () => {
    const place = countries[BRAZIL.slug];

    await expect(
      homeMetadata({
        params: EN_ROUTE_PARAMS,
        searchParams: Promise.resolve({ country: BRAZIL.slug }),
      }),
    ).resolves.toMatchObject({
      title: seo.countryCompaniesTitle(place),
      description: seo.countryCompaniesDescription(place),
      alternates: { canonical: `/?country=${BRAZIL.slug}` },
      robots: { index: true },
    });
    await expect(
      jobsMetadata({
        params: EN_ROUTE_PARAMS,
        searchParams: Promise.resolve({ country: BRAZIL.slug }),
      }),
    ).resolves.toMatchObject({
      title: seo.countryJobsTitle(place),
      description: seo.countryJobsDescription(place),
      robots: { index: true },
    });
    expect(filterJobCount).toHaveBeenCalledWith({ country: BRAZIL.slug });
  });

  it('indexes a single focus filter that has enough jobs, under its own title', async () => {
    const track = focus[JOB_FOCUS_PRODUCT];

    await expect(
      jobsMetadata({
        params: EN_ROUTE_PARAMS,
        searchParams: Promise.resolve({ focus: JOB_FOCUS_PRODUCT }),
      }),
    ).resolves.toMatchObject({
      title: seo.focusJobsTitle(track),
      description: seo.focusJobsDescription(track),
      robots: { index: true },
    });
    await expect(
      homeMetadata({
        params: EN_ROUTE_PARAMS,
        searchParams: Promise.resolve({ focus: JOB_FOCUS_PRODUCT }),
      }),
    ).resolves.toMatchObject({
      title: seo.focusCompaniesTitle(track),
      robots: { index: true },
    });
  });

  it('keeps thin, combined, and extra-filter views out of the index', async () => {
    vi.mocked(filterJobCount).mockResolvedValueOnce(MIN_INDEXABLE_JOBS - 1);
    const thin = await jobsMetadata({
      params: EN_ROUTE_PARAMS,
      searchParams: Promise.resolve({ country: BRAZIL.slug }),
    });
    const combined = await homeMetadata({
      params: EN_ROUTE_PARAMS,
      searchParams: Promise.resolve({
        country: BRAZIL.slug,
        focus: JOB_FOCUS_PRODUCT,
      }),
    });
    const extraFilter = await jobsMetadata({
      params: EN_ROUTE_PARAMS,
      searchParams: Promise.resolve({
        country: BRAZIL.slug,
        technology: 'React',
      }),
    });

    for (const metadata of [thin, combined, extraFilter]) {
      expect(metadata).toMatchObject({ robots: { index: false } });
    }
  });

  it('localizes a Portuguese view and links both language versions', async () => {
    const portuguese = messagesFor(I18N_TEST.portuguese);
    const query = `?country=${BRAZIL.slug}`;

    await expect(
      jobsMetadata({
        params: PT_ROUTE_PARAMS,
        searchParams: Promise.resolve({ country: BRAZIL.slug }),
      }),
    ).resolves.toMatchObject({
      title: portuguese.seo.countryJobsTitle(portuguese.countries[BRAZIL.slug]),
      alternates: {
        canonical: `/pt-BR/jobs${query}`,
        languages: {
          en: `/jobs${query}`,
          'pt-BR': `/pt-BR/jobs${query}`,
          'x-default': `/jobs${query}`,
        },
      },
      robots: { index: true },
    });
  });
});

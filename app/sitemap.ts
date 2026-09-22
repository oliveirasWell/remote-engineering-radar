import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { localizedPath } from '@/lib/i18n/localized-path/localized-path';
import { LOCALES } from '@/lib/i18n/messages';
import { MIN_INDEXABLE_JOBS } from '@/lib/seo/constants';
import { filterJobCount } from '@/lib/seo/filter-job-count';
import { INDEXABLE_FILTERS } from '@/lib/seo/indexable-filter/indexable-filter';
import { sitemapJobs } from '@/lib/seo/sitemap-jobs';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';

/** Query strings of the single-filter views that are indexed. */
const sitemapFilters = async (): Promise<string[]> => {
  const counts = await Promise.all(
    INDEXABLE_FILTERS.map((filter) => filterJobCount(filter)),
  );
  return INDEXABLE_FILTERS.filter(
    (_filter, index) => counts[index] >= MIN_INDEXABLE_JOBS,
  ).map((filter) =>
    new URLSearchParams(
      filter.country ? { country: filter.country } : { focus: filter.focus },
    ).toString(),
  );
};

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  // Keep the build DB-free while bounding the runtime query's cache lifetime.
  await connection();
  const jobs = await sitemapJobs();
  const indexableFilters = await sitemapFilters();
  const origin = siteOrigin();
  // Ingestion updates updatedAt on every sighting, not only content changes.
  // Omit lastModified rather than inventing modification times.
  return [
    '/',
    '/jobs',
    '/about',
    ...indexableFilters.flatMap((query) => [`/?${query}`, `/jobs?${query}`]),
    ...jobs.map(({ id }) => `/jobs/${id}`),
  ].flatMap((path) => {
    const languages = Object.fromEntries(
      LOCALES.map((locale) => [
        locale,
        new URL(localizedPath(locale, path), origin).href,
      ]),
    );
    return LOCALES.map((locale) => ({
      url: languages[locale],
      alternates: { languages },
    }));
  });
};

export default sitemap;

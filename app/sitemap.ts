import type { MetadataRoute } from 'next';
import { connection } from 'next/server';
import { sitemapJobs } from '@/lib/seo/sitemap-jobs';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';

const sitemap = async (): Promise<MetadataRoute.Sitemap> => {
  // Keep the build DB-free while bounding the runtime query's cache lifetime.
  await connection();
  const jobs = await sitemapJobs();
  const origin = siteOrigin();
  // Ingestion updates updatedAt on every sighting, not only content changes.
  // Omit lastModified rather than inventing modification times.
  return ['/', '/jobs', '/about', ...jobs.map(({ id }) => `/jobs/${id}`)].map(
    (path) => ({
      url: new URL(path, origin).href,
    }),
  );
};

export default sitemap;

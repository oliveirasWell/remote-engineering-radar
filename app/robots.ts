import type { MetadataRoute } from 'next';
import { siteOrigin } from '@/lib/seo/site-origin/site-origin';

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: '/' },
  sitemap: new URL('/sitemap.xml', siteOrigin()).href,
});

export default robots;

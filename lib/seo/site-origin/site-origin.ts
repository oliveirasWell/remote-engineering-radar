import 'server-only';
import { DEFAULT_SITE_ORIGIN, SITE_URL_ERROR } from '../constants';

export const siteOrigin = (): URL => {
  const value = process.env.SITE_URL?.trim() || DEFAULT_SITE_ORIGIN;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(SITE_URL_ERROR);
  }
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(SITE_URL_ERROR);
  }
  return new URL(url.origin);
};

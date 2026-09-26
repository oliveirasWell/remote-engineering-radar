import 'server-only';
import { DEFAULT_SITE_ORIGIN, SITE_URL_ERROR } from '../constants';

const parseOrigin = (value: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(SITE_URL_ERROR);
  }
};

export const siteOrigin = (): URL => {
  const url = parseOrigin(process.env.SITE_URL?.trim() || DEFAULT_SITE_ORIGIN);
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

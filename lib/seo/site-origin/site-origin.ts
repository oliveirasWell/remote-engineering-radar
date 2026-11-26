import 'server-only';
import { CANONICAL_SITE_ORIGIN, SITE_URL_ERROR } from '../constants';

const parseOrigin = (value: string): URL => {
  try {
    return new URL(value);
  } catch {
    throw new Error(SITE_URL_ERROR);
  }
};

export const siteOrigin = (): URL => {
  const configured =
    process.env.VERCEL_ENV === 'production'
      ? undefined
      : process.env.SITE_URL?.trim();
  const url = parseOrigin(configured || CANONICAL_SITE_ORIGIN);
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

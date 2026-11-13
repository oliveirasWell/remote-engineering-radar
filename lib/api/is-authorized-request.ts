import { createHash, timingSafeEqual } from 'node:crypto';

const BEARER_PREFIX = 'Bearer ';

// Equal-length digests let timingSafeEqual compare tokens of any length.
const digest = (value: string): Buffer =>
  createHash('sha256').update(value).digest();

/** Fails closed: an unset `RADAR_API_TOKEN` rejects every request. */
export const isAuthorizedRequest = (request: Request): boolean => {
  const expected = process.env.RADAR_API_TOKEN;
  const header = request.headers.get('authorization');
  if (!expected || !header?.startsWith(BEARER_PREFIX)) {
    return false;
  }
  const provided = header.slice(BEARER_PREFIX.length);
  return (
    provided.length > 0 && timingSafeEqual(digest(provided), digest(expected))
  );
};

import { DIGEST_CONTACT_PROPERTY_KEYS } from './digest-email/constants';
import { pacedResendRequest } from './paced-request';
import { pauseResend, ResendError } from './resend';

type PropertyPage = {
  data: { id: string; key: string }[];
};

/**
 * Broadcasts only interpolate contact properties that already exist on the
 * account. Create the digest keys once; a 409 means another run created them.
 */
export const ensureDigestContactProperties = async (paceMs: number) => {
  const page = await pacedResendRequest<PropertyPage>(
    paceMs,
    '/contact-properties?limit=100',
  );
  const existing = new Set(page.data.map(({ key }) => key));
  const missing = DIGEST_CONTACT_PROPERTY_KEYS.filter(
    (key) => !existing.has(key),
  );
  for (const key of missing) {
    try {
      await pacedResendRequest(paceMs, '/contact-properties', {
        method: 'POST',
        body: { key, type: 'string' },
      });
    } catch (error) {
      if (!(error instanceof ResendError && error.status === 409)) {
        throw error;
      }
      await pauseResend(paceMs);
    }
  }
};

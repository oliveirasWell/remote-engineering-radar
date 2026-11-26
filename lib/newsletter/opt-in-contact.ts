import 'server-only';
import type { Locale } from '@/lib/i18n/messages';
import { ResendError, resendRequest } from './resend';
import {
  otherSegmentId,
  segmentIdForLocale,
} from './segment-for-locale/segment-for-locale';

/**
 * Adds a confirmed address to the segment for its language. An existing
 * contact may have changed filters or opted out; only a confirmed request
 * opts it back in. The other language segment is left so one person is not
 * in both broadcasts.
 */
const removeFromSegment = async (email: string, segmentId: string) => {
  try {
    await resendRequest(
      `/contacts/${encodeURIComponent(email)}/segments/${segmentId}`,
      { method: 'DELETE' },
    );
  } catch (error) {
    if (!(error instanceof ResendError && error.status === 404)) {
      throw error;
    }
  }
};

const leaveOtherSegment = async (email: string, locale: Locale) => {
  const other = otherSegmentId(locale);
  if (other) {
    await removeFromSegment(email, other);
  }
};

export const optInContact = async (email: string, locale: Locale) => {
  const segmentId = segmentIdForLocale(locale);
  try {
    await resendRequest('/contacts', {
      method: 'POST',
      body: {
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      },
    });
  } catch (error) {
    if (!(error instanceof ResendError && error.status === 409)) {
      throw error;
    }
    await resendRequest(`/contacts/${encodeURIComponent(email)}`, {
      method: 'PATCH',
      body: { unsubscribed: false },
    });
    await resendRequest(
      `/contacts/${encodeURIComponent(email)}/segments/${segmentId}`,
      { method: 'POST' },
    );
  }
  await leaveOtherSegment(email, locale);
};

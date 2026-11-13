import 'server-only';
import { ResendError, resendRequest } from './resend';

/**
 * Adds a confirmed address to the newsletter segment. An existing contact may
 * have changed filters or opted out; only a confirmed request opts it back in.
 */
export const optInContact = async (email: string, segmentId: string) => {
  try {
    await resendRequest('/contacts', {
      method: 'POST',
      body: {
        email,
        unsubscribed: false,
        properties: { daily_jobs: 'No new jobs / Sem vagas novas.' },
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
};

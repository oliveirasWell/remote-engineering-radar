import 'server-only';

const API = 'https://api.resend.com';

export class ResendError extends Error {
  constructor(readonly status: number) {
    super(`Resend request failed (${status})`);
  }
}

export const resendConfig = () => {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM;
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!key || !from || !segmentId) {
    throw new Error(
      'Newsletter requires RESEND_API_KEY, RESEND_FROM and RESEND_SEGMENT_ID',
    );
  }
  return { key, from, segmentId };
};

/** Contact and segment operations; sending email also needs `RESEND_FROM`. */
export const resendSegmentId = () => {
  const segmentId = process.env.RESEND_SEGMENT_ID;
  if (!segmentId) {
    throw new Error('Newsletter requires RESEND_SEGMENT_ID');
  }
  return segmentId;
};

export const resendRequest = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> => {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('Newsletter requires RESEND_API_KEY');
  }
  const response = await fetch(`${API}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    ...(options.body === undefined
      ? {}
      : { body: JSON.stringify(options.body) }),
    cache: 'no-store',
  });
  if (!response.ok) {
    // Never include the provider response: it may contain addresses or keys.
    throw new ResendError(response.status);
  }
  return (await response.json()) as T;
};

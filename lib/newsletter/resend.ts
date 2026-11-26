import 'server-only';
import {
  RESEND_API_KEY_ENV,
  RESEND_FROM_ENV,
  RESEND_SEGMENT_ID_ENV,
  newsletterRequiresMessage,
} from './constants';

const API = 'https://api.resend.com';
const SENDING_ENV = [
  RESEND_API_KEY_ENV,
  RESEND_FROM_ENV,
  RESEND_SEGMENT_ID_ENV,
] as const;

const readEnv = (name: string) => process.env[name]?.trim() ?? '';

export class ResendError extends Error {
  constructor(readonly status: number) {
    super(`Resend request failed (${status})`);
  }
}

export const resendConfig = () => {
  const key = readEnv(RESEND_API_KEY_ENV);
  const from = readEnv(RESEND_FROM_ENV);
  const segmentId = readEnv(RESEND_SEGMENT_ID_ENV);
  const configured = {
    [RESEND_API_KEY_ENV]: key,
    [RESEND_FROM_ENV]: from,
    [RESEND_SEGMENT_ID_ENV]: segmentId,
  };
  const missing = SENDING_ENV.filter((name) => configured[name] === '');
  if (missing.length > 0) {
    throw new Error(newsletterRequiresMessage(missing));
  }
  return { key, from, segmentId };
};

export const resendRequest = async <T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> => {
  const key = readEnv(RESEND_API_KEY_ENV);
  if (key === '') {
    throw new Error(newsletterRequiresMessage([RESEND_API_KEY_ENV]));
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

export const pauseResend = (paceMs: number) =>
  paceMs > 0
    ? new Promise((resolve) => {
        setTimeout(resolve, paceMs);
      })
    : Promise.resolve();

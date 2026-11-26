import { pauseResend, resendRequest } from './resend';

/** Lives outside resend.ts so tests can replace `resendRequest` and still pace. */
export const pacedResendRequest = async <T>(
  paceMs: number,
  path: string,
  options: { method?: string; body?: unknown } = {},
): Promise<T> => {
  const result = await resendRequest<T>(path, options);
  await pauseResend(paceMs);
  return result;
};

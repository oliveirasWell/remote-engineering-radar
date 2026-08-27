export const SOURCE_REQUEST_TIMEOUT_MS = 15_000;
export const SOURCE_MAX_RESPONSE_BYTES = 5_000_000;
const SOURCE_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;

const isRetryableStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

const retryDelay = (response: Response, attempt: number): number => {
  const retryAfter = Number(response.headers.get('retry-after'));
  if (Number.isFinite(retryAfter) && retryAfter >= 0) {
    return Math.min(retryAfter * 1000, 5_000);
  }

  return Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, 5_000);
};

const wait = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const fetchWithRetry = async (
  input: RequestInfo | URL,
  fetchImpl: typeof fetch,
): Promise<Response> => {
  for (let attempt = 0; attempt < SOURCE_MAX_ATTEMPTS; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      SOURCE_REQUEST_TIMEOUT_MS,
    );

    try {
      const response = await fetchImpl(input, { signal: controller.signal });
      if (
        !isRetryableStatus(response.status) ||
        attempt === SOURCE_MAX_ATTEMPTS - 1
      ) {
        return response;
      }
      await wait(retryDelay(response, attempt));
    } catch (error) {
      if (attempt === SOURCE_MAX_ATTEMPTS - 1) {
        throw error;
      }
      await wait(RETRY_BASE_DELAY_MS * 2 ** attempt);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new Error('Source request failed after retries');
};

export const readJsonResponse = async <T>(response: Response): Promise<T> => {
  const contentLength = Number(response.headers.get('content-length'));
  if (
    Number.isFinite(contentLength) &&
    contentLength > SOURCE_MAX_RESPONSE_BYTES
  ) {
    throw new Error('Source response exceeded the size limit');
  }

  const body = await response.text();
  if (new TextEncoder().encode(body).byteLength > SOURCE_MAX_RESPONSE_BYTES) {
    throw new Error('Source response exceeded the size limit');
  }

  return JSON.parse(body) as T;
};

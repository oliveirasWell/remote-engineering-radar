export const SOURCE_REQUEST_TIMEOUT_MS = 15_000;
export const SOURCE_MAX_RESPONSE_BYTES = 5_000_000;
const SOURCE_MAX_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 250;
const MAX_RETRY_DELAY_MS = 5_000;

type ResponseDeadline = {
  controller: AbortController;
  timeout: ReturnType<typeof setTimeout>;
};

const responseDeadlines = new WeakMap<Response, ResponseDeadline>();

const isRateLimited = (response: Response): boolean =>
  response.status === 403 &&
  (response.headers.has('retry-after') ||
    response.headers.get('x-ratelimit-remaining')?.trim() === '0');

const isRetryableResponse = (response: Response): boolean =>
  response.status === 408 ||
  response.status === 429 ||
  response.status >= 500 ||
  isRateLimited(response);

const retryAfterDelay = (value: string | null): number | undefined => {
  if (value === null) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds * 1000;
  }

  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : undefined;
};

const rateLimitResetDelay = (value: string | null): number | undefined => {
  if (value === null) {
    return undefined;
  }

  const resetAtSeconds = Number(value);
  return Number.isFinite(resetAtSeconds)
    ? Math.max(0, resetAtSeconds * 1000 - Date.now())
    : undefined;
};

const retryDelay = (
  response: Response,
  attempt: number,
): number | undefined => {
  const headerDelay =
    retryAfterDelay(response.headers.get('retry-after')) ??
    rateLimitResetDelay(response.headers.get('x-ratelimit-reset'));

  if (headerDelay !== undefined) {
    return headerDelay <= MAX_RETRY_DELAY_MS ? headerDelay : undefined;
  }

  return Math.min(RETRY_BASE_DELAY_MS * 2 ** attempt, MAX_RETRY_DELAY_MS);
};

const wait = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const readChunk = async (
  reader: ReadableStreamDefaultReader<Uint8Array>,
  deadline: ResponseDeadline | undefined,
): Promise<ReadableStreamReadResult<Uint8Array>> => {
  if (!deadline) {
    return reader.read();
  }

  const signal = deadline.controller.signal;
  if (signal.aborted) {
    throw signal.reason;
  }

  return new Promise((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    reader.read().then(
      (result) => {
        signal.removeEventListener('abort', onAbort);
        resolve(result);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
};

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
    let keepTimeout = false;

    try {
      const response = await fetchImpl(input, { signal: controller.signal });
      if (
        !isRetryableResponse(response) ||
        attempt === SOURCE_MAX_ATTEMPTS - 1
      ) {
        responseDeadlines.set(response, { controller, timeout });
        keepTimeout = true;
        return response;
      }

      const delay = retryDelay(response, attempt);
      if (delay === undefined) {
        responseDeadlines.set(response, { controller, timeout });
        keepTimeout = true;
        return response;
      }

      clearTimeout(timeout);
      void response.body?.cancel().catch(() => undefined);
      await wait(delay);
    } catch (error) {
      if (attempt === SOURCE_MAX_ATTEMPTS - 1) {
        throw error;
      }
      await wait(RETRY_BASE_DELAY_MS * 2 ** attempt);
    } finally {
      if (!keepTimeout) {
        clearTimeout(timeout);
      }
    }
  }

  throw new Error('Source request failed after retries');
};

export const discardResponse = async (response: Response): Promise<void> => {
  const deadline = responseDeadlines.get(response);
  if (deadline) {
    clearTimeout(deadline.timeout);
    responseDeadlines.delete(response);
  }
  await response.body?.cancel().catch(() => undefined);
};

export const readJsonResponse = async <T>(response: Response): Promise<T> => {
  const deadline = responseDeadlines.get(response);
  const reader = response.body?.getReader();

  try {
    const contentLengthHeader = response.headers.get('content-length');
    const contentLength =
      contentLengthHeader === null ? undefined : Number(contentLengthHeader);
    if (
      contentLength !== undefined &&
      Number.isFinite(contentLength) &&
      contentLength > SOURCE_MAX_RESPONSE_BYTES
    ) {
      throw new Error('Source response exceeded the size limit');
    }

    const decoder = new TextDecoder();
    let body = '';
    let bytesRead = 0;

    while (reader) {
      const result = await readChunk(reader, deadline);

      if (result.done) {
        break;
      }

      bytesRead += result.value.byteLength;
      if (bytesRead > SOURCE_MAX_RESPONSE_BYTES) {
        throw new Error('Source response exceeded the size limit');
      }
      body += decoder.decode(result.value, { stream: true });
    }

    body += decoder.decode();
    return JSON.parse(body) as T;
  } finally {
    if (deadline) {
      clearTimeout(deadline.timeout);
      responseDeadlines.delete(response);
    }
    void reader?.cancel().catch(() => undefined);
  }
};

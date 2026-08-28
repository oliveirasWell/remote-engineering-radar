import { jsonResponse } from '@/test/http';

import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
  SOURCE_MAX_RESPONSE_BYTES,
  SOURCE_REQUEST_TIMEOUT_MS,
} from './fetch-json';

describe('fetchWithRetry', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries transient failures', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: 'temporary' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const responsePromise = fetchWithRetry('https://example.com', fetchMock);
    await vi.advanceTimersByTimeAsync(250);
    const response = await responsePromise;

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    await expect(readJsonResponse(response)).resolves.toEqual({ ok: true });
  });

  it('does not retry an ordinary forbidden response', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ error: 'forbidden' }, 403));

    const response = await fetchWithRetry('https://example.com', fetchMock);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await readJsonResponse(response);
  });

  it('retries a rate-limited 403 after Retry-After', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('{}', {
          status: 403,
          headers: { 'retry-after': '2' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const responsePromise = fetchWithRetry('https://example.com', fetchMock);
    await vi.advanceTimersByTimeAsync(1_999);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);

    await expect(readJsonResponse(await responsePromise)).resolves.toEqual({
      ok: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('does not retry before a distant X-RateLimit-Reset', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-28T12:00:00Z'));
    const resetAt = Math.floor(Date.now() / 1000) + 60;
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response('{}', {
          status: 403,
          headers: {
            'x-ratelimit-remaining': '0',
            'x-ratelimit-reset': String(resetAt),
          },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const response = await fetchWithRetry('https://example.com', fetchMock);

    expect(response.status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(readJsonResponse(response)).resolves.toEqual({});
  });

  it('discards an unused error response and clears its timeout', async () => {
    vi.useFakeTimers();
    let canceled = false;
    const fetchMock = vi.fn<typeof fetch>(async () =>
      Promise.resolve(
        new Response(
          new ReadableStream({
            cancel() {
              canceled = true;
            },
          }),
          { status: 400 },
        ),
      ),
    );

    const response = await fetchWithRetry('https://example.com', fetchMock);
    const signal = fetchMock.mock.calls.at(-1)?.[1]?.signal;
    await discardResponse(response);
    await vi.advanceTimersByTimeAsync(SOURCE_REQUEST_TIMEOUT_MS);

    expect(canceled).toBe(true);
    expect(signal?.aborted).toBe(false);
  });
});

describe('readJsonResponse', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses a response within the size limit', async () => {
    await expect(readJsonResponse(jsonResponse({ ok: true }))).resolves.toEqual(
      {
        ok: true,
      },
    );
  });

  it('rejects responses larger than the configured limit', async () => {
    const response = new Response('{}', {
      headers: { 'content-length': String(SOURCE_MAX_RESPONSE_BYTES + 1) },
    });

    await expect(readJsonResponse(response)).rejects.toThrow(
      'Source response exceeded the size limit',
    );
  });

  it('enforces the size limit while streaming a dishonest response', async () => {
    let chunksSent = 0;
    let canceled = false;
    const chunk = new Uint8Array(1_000_001);
    const response = new Response(
      new ReadableStream({
        pull(controller) {
          chunksSent += 1;
          controller.enqueue(chunk);
        },
        cancel() {
          canceled = true;
          return new Promise<void>(() => undefined);
        },
      }),
      { headers: { 'content-length': '2' } },
    );

    await expect(readJsonResponse(response)).rejects.toThrow(
      'Source response exceeded the size limit',
    );
    expect(chunksSent).toBeLessThan(10);
    expect(canceled).toBe(true);
  });

  it('keeps the request timeout active while consuming the body', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn<typeof fetch>(async () => {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode('{"ok":'));
          },
        }),
      );
    });

    const response = await fetchWithRetry('https://example.com', fetchMock);
    const bodyResult = expect(readJsonResponse(response)).rejects.toMatchObject(
      {
        name: 'AbortError',
      },
    );
    await vi.advanceTimersByTimeAsync(SOURCE_REQUEST_TIMEOUT_MS);

    await bodyResult;
    expect(fetchMock.mock.calls[0]?.[1]?.signal?.aborted).toBe(true);
  });
});

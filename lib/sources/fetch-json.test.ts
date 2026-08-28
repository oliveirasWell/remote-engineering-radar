import { jsonResponse } from '@/test/http';

import {
  fetchWithRetry,
  readJsonResponse,
  SOURCE_MAX_RESPONSE_BYTES,
} from './fetch-json';

describe('fetchWithRetry', () => {
  it('retries transient failures', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(jsonResponse({ error: 'temporary' }, 503))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const response = await fetchWithRetry('https://example.com', fetchMock);

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('readJsonResponse', () => {
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
});

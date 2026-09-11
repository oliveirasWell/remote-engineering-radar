import { initIngestSentry, reportIngestionSourceFailures } from './ingest';

const mocks = vi.hoisted(() => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock('@sentry/node', () => ({
  init: mocks.init,
  captureException: mocks.captureException,
}));

describe('ingest Sentry reporting', () => {
  beforeEach(() => {
    mocks.init.mockReset();
    mocks.captureException.mockReset();
  });

  it('initializes Sentry only when a DSN is present', () => {
    expect(initIngestSentry({ NODE_ENV: 'test' })).toBe(false);
    expect(mocks.init).not.toHaveBeenCalled();

    expect(
      initIngestSentry({
        SENTRY_DSN: 'https://key@example.com/1',
        NODE_ENV: 'production',
      }),
    ).toBe(true);
    expect(mocks.init).toHaveBeenCalledWith({
      dsn: 'https://key@example.com/1',
      environment: 'production',
      tracesSampleRate: 0,
    });
  });

  it('prefers SENTRY_DSN over NEXT_PUBLIC_SENTRY_DSN', () => {
    initIngestSentry({
      SENTRY_DSN: 'https://private@example.com/1',
      NEXT_PUBLIC_SENTRY_DSN: 'https://public@example.com/2',
      NODE_ENV: 'production',
    });

    expect(mocks.init).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://private@example.com/1' }),
    );
  });

  it('reports each failed source with stable fingerprint tags', () => {
    reportIngestionSourceFailures(
      [
        {
          name: 'vagasremotas',
          error: 'Vagas Remotas request failed (page 1): 403',
        },
        { name: 'ashby', error: 'Ashby request failed: 500' },
      ],
      mocks.captureException,
    );

    expect(mocks.captureException).toHaveBeenCalledTimes(2);
    expect(mocks.captureException).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        message:
          'Source vagasremotas failed: Vagas Remotas request failed (page 1): 403',
      }),
      {
        tags: { job: 'ingest', source: 'vagasremotas' },
        fingerprint: ['ingest-source-failure', 'vagasremotas'],
      },
    );
    expect(mocks.captureException).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        message: 'Source ashby failed: Ashby request failed: 500',
      }),
      {
        tags: { job: 'ingest', source: 'ashby' },
        fingerprint: ['ingest-source-failure', 'ashby'],
      },
    );
  });
});

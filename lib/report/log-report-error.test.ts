import { logReportError } from './log-report-error';

describe('logReportError', () => {
  it('logs context without exposing database URLs', () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    logReportError(
      'home',
      new Error('query failed', {
        cause: new Error(
          'failed postgres://user:password@db.example.com/database',
        ),
      }),
    );

    expect(consoleError).toHaveBeenCalledWith(
      '[report] home: Error: query failed <- Error: failed [redacted database URL]',
    );
    consoleError.mockRestore();
  });
});

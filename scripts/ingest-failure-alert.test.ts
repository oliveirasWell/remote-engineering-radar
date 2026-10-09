import {
  INGEST_FAILURE_ALERT_MESSAGE,
  INGEST_FAILURE_ISSUE_TITLE,
  publishIngestFailureAlert,
  type IngestFailureIssueClient,
} from './ingest-failure-alert';

const RUN_URL =
  'https://github.com/oliveirasWell/remote-engineering-radar/actions/runs/37779762726';
const EVENT_NAME = 'schedule';
const SHA = '4518e94ca4cb4f07b5f1efdef0a063585fb63f35';
const DETAILS = { runUrl: RUN_URL, eventName: EVENT_NAME, sha: SHA };
const OPEN_ISSUE_NUMBER = 12;

const OTHER_ISSUE_TITLE = 'Something else';

const client = () => {
  const listOpenIssues = vi.fn<IngestFailureIssueClient['listOpenIssues']>(
    async () => [],
  );
  const createIssue = vi.fn<IngestFailureIssueClient['createIssue']>();
  const commentOnIssue = vi.fn<IngestFailureIssueClient['commentOnIssue']>();
  const github: IngestFailureIssueClient = {
    listOpenIssues,
    createIssue,
    commentOnIssue,
  };
  return { github, listOpenIssues, createIssue, commentOnIssue };
};

describe('publishIngestFailureAlert', () => {
  it('opens a severe issue when ingest has not already failed', async () => {
    const { github, createIssue, commentOnIssue } = client();

    await expect(publishIngestFailureAlert(github, DETAILS)).resolves.toBe(
      'created',
    );

    expect(createIssue).toHaveBeenCalledWith(
      INGEST_FAILURE_ISSUE_TITLE,
      [
        INGEST_FAILURE_ALERT_MESSAGE,
        '',
        `Run: ${RUN_URL}`,
        `Event: ${EVENT_NAME}`,
        `Commit: ${SHA}`,
      ].join('\n'),
    );
    expect(commentOnIssue).not.toHaveBeenCalled();
  });

  it('comments on the open severe issue instead of opening another one', async () => {
    const { github, listOpenIssues, createIssue, commentOnIssue } = client();
    listOpenIssues.mockResolvedValueOnce([
      { number: 4, title: OTHER_ISSUE_TITLE },
      { number: OPEN_ISSUE_NUMBER, title: INGEST_FAILURE_ISSUE_TITLE },
    ]);

    await expect(publishIngestFailureAlert(github, DETAILS)).resolves.toBe(
      'commented',
    );

    expect(commentOnIssue).toHaveBeenCalledWith(
      OPEN_ISSUE_NUMBER,
      expect.stringContaining(RUN_URL),
    );
    expect(createIssue).not.toHaveBeenCalled();
  });
});

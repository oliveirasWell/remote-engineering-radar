import { pathToFileURL } from 'node:url';

export const INGEST_FAILURE_ISSUE_TITLE = '[severe] Production ingest failed';

export const INGEST_FAILURE_ALERT_MESSAGE =
  'Production ingest failed. The catalog was not updated.';

const GITHUB_API_URL = 'https://api.github.com';
const GITHUB_ACCEPT = 'application/vnd.github+json';

export type IngestFailureDetails = {
  runUrl: string;
  eventName: string;
  sha: string;
};

export type IngestFailureIssueClient = {
  listOpenIssues: () => Promise<{ number: number; title: string }[]>;
  createIssue: (title: string, body: string) => Promise<void>;
  commentOnIssue: (issueNumber: number, body: string) => Promise<void>;
};

export const ingestFailureIssueBody = ({
  runUrl,
  eventName,
  sha,
}: IngestFailureDetails): string =>
  [
    INGEST_FAILURE_ALERT_MESSAGE,
    '',
    `Run: ${runUrl}`,
    `Event: ${eventName}`,
    `Commit: ${sha}`,
  ].join('\n');

export const publishIngestFailureAlert = async (
  client: IngestFailureIssueClient,
  details: IngestFailureDetails,
): Promise<'created' | 'commented'> => {
  const body = ingestFailureIssueBody(details);
  const open = (await client.listOpenIssues()).find(
    (issue) => issue.title === INGEST_FAILURE_ISSUE_TITLE,
  );
  if (open) {
    await client.commentOnIssue(open.number, body);
    return 'commented';
  }

  await client.createIssue(INGEST_FAILURE_ISSUE_TITLE, body);
  return 'created';
};

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
};

const isIssue = (value: unknown): value is { number: number; title: string } =>
  typeof value === 'object' &&
  value !== null &&
  'number' in value &&
  typeof value.number === 'number' &&
  'title' in value &&
  typeof value.title === 'string';

const githubJson = async (
  token: string,
  path: string,
  init?: RequestInit,
): Promise<unknown> => {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    ...init,
    headers: {
      accept: GITHUB_ACCEPT,
      authorization: `Bearer ${token}`,
      ...(init?.body ? { 'content-type': 'application/json' } : {}),
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub request failed: ${response.status} ${path}`);
  }
  return response.json();
};

const githubClient = (
  token: string,
  repository: string,
): IngestFailureIssueClient => ({
  listOpenIssues: async () => {
    const payload = await githubJson(
      token,
      `/repos/${repository}/issues?state=open&per_page=100`,
    );
    if (!Array.isArray(payload) || !payload.every(isIssue)) {
      throw new Error('GitHub issues response has an unexpected shape');
    }
    return payload.map(({ number, title }) => ({ number, title }));
  },
  createIssue: async (title, body) => {
    await githubJson(token, `/repos/${repository}/issues`, {
      method: 'POST',
      body: JSON.stringify({ title, body }),
    });
  },
  commentOnIssue: async (issueNumber, body) => {
    await githubJson(
      token,
      `/repos/${repository}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        body: JSON.stringify({ body }),
      },
    );
  },
});

const alert = async (): Promise<void> => {
  const outcome = await publishIngestFailureAlert(
    githubClient(requireEnv('GITHUB_TOKEN'), requireEnv('GITHUB_REPOSITORY')),
    {
      runUrl: requireEnv('INGEST_RUN_URL'),
      eventName: requireEnv('INGEST_EVENT_NAME'),
      sha: requireEnv('INGEST_SHA'),
    },
  );
  console.log(`Ingest failure alert ${outcome}`);
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  alert().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

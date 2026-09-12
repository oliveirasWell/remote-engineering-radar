import { pathToFileURL } from 'node:url';
import * as Sentry from '@sentry/node';
import { createDb, disconnectDb } from '../lib/db/client';
import { runIngestion } from '../lib/ingestion/run-ingestion';
import { createAshbyAdapter } from '../lib/sources/ashby/ashby-adapter';
import { createFrontendBrAdapter } from '../lib/sources/frontendbr/frontendbr-adapter';
import { createGetOnBrdAdapter } from '../lib/sources/getonbrd/getonbrd-adapter';
import { createGreenhouseAdapter } from '../lib/sources/greenhouse/greenhouse-adapter';
import { createHackerNewsAdapter } from '../lib/sources/hackernews/hackernews-adapter';
import { createHimalayasAdapter } from '../lib/sources/himalayas/himalayas-adapter';
import { createJobicyAdapter } from '../lib/sources/jobicy/jobicy-adapter';
import { createLeverAdapter } from '../lib/sources/lever/lever-adapter';
import { createVagasRemotasAdapter } from '../lib/sources/vagasremotas/vagasremotas-adapter';
import { createYCombinatorAdapter } from '../lib/sources/ycombinator/ycombinator-adapter';

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const MAX_CONFIGURED_BOARDS = 100;
const SENTRY_FLUSH_TIMEOUT_MS = 5_000;

export const initIngestSentry = (
  env: {
    SENTRY_DSN?: string;
    NEXT_PUBLIC_SENTRY_DSN?: string;
    NODE_ENV?: string;
  } = process.env,
): boolean => {
  const dsn = env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    return false;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: 0,
  });
  return true;
};

export const reportIngestionSourceFailures = (
  failed: Array<{ name: string; error: string }>,
  captureException: typeof Sentry.captureException = Sentry.captureException,
): void => {
  for (const source of failed) {
    captureException(
      new Error(`Source ${source.name} failed: ${source.error}`),
      {
        tags: { job: 'ingest', source: source.name },
        fingerprint: ['ingest-source-failure', source.name],
      },
    );
  }
};

const main = async () => {
  const greenhouseBoards = splitList(process.env.GREENHOUSE_BOARD_TOKENS);
  const ashbyBoards = splitList(process.env.ASHBY_BOARD_NAMES);
  const leverBoards = splitList(process.env.LEVER_BOARD_SLUGS);

  if (
    greenhouseBoards.length > MAX_CONFIGURED_BOARDS ||
    ashbyBoards.length > MAX_CONFIGURED_BOARDS ||
    leverBoards.length > MAX_CONFIGURED_BOARDS
  ) {
    throw new Error(
      `At most ${MAX_CONFIGURED_BOARDS} boards may be configured`,
    );
  }

  const sources = [
    ...(greenhouseBoards.length > 0
      ? [createGreenhouseAdapter({ boardTokens: greenhouseBoards })]
      : []),
    ...(ashbyBoards.length > 0
      ? [createAshbyAdapter({ boardNames: ashbyBoards })]
      : []),
    ...(leverBoards.length > 0
      ? [createLeverAdapter({ boardSlugs: leverBoards })]
      : []),
    createGetOnBrdAdapter(),
    createHackerNewsAdapter(),
    createHimalayasAdapter(),
    createJobicyAdapter(),
    createFrontendBrAdapter({ token: process.env.GITHUB_TOKEN }),
    createVagasRemotasAdapter(),
    createYCombinatorAdapter(),
  ];

  const sentryEnabled = initIngestSentry();
  const db = createDb();
  try {
    const result = await runIngestion({ db, sources });
    console.log(JSON.stringify(result, null, 2));

    const failed = result.sources.flatMap((source) =>
      source.error === undefined
        ? []
        : [{ name: source.name, error: source.error }],
    );
    if (failed.length > 0) {
      reportIngestionSourceFailures(failed);
      process.exitCode = 1;
    }
  } finally {
    await disconnectDb(db);
    if (sentryEnabled) {
      await Sentry.flush(SENTRY_FLUSH_TIMEOUT_MS);
    }
  }
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(async (error) => {
    const sentryEnabled = initIngestSentry();
    console.error(error instanceof Error ? error.message : error);
    Sentry.captureException(error, {
      tags: { job: 'ingest' },
      fingerprint: ['ingest-fatal'],
    });
    if (sentryEnabled) {
      await Sentry.flush(SENTRY_FLUSH_TIMEOUT_MS);
    }
    process.exitCode = 1;
  });
}

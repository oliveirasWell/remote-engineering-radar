import { pathToFileURL } from 'node:url';
import * as Sentry from '@sentry/node';
import { createDb, disconnectDb } from '../lib/db/client';
import { createAtsBoardsRepository } from '../lib/db/repositories/ats-boards-repository';
import { INGESTION_TRANSACTION_TIMEOUT_MS } from '../lib/ingestion/constants';
import { runIngestion } from '../lib/ingestion/run-ingestion';
import { createAshbyAdapter } from '../lib/sources/ashby/ashby-adapter';
import { ASHBY_BOARD_NAMES } from '../lib/sources/ashby/constants';
import {
  buildFetchSet,
  type FetchBoard,
} from '../lib/sources/board-discovery/build-fetch-set';
import { createFrontendBrAdapter } from '../lib/sources/frontendbr/frontendbr-adapter';
import { createGetOnBrdAdapter } from '../lib/sources/getonbrd/getonbrd-adapter';
import { createGreenhouseAdapter } from '../lib/sources/greenhouse/greenhouse-adapter';
import { GREENHOUSE_BOARD_TOKENS } from '../lib/sources/greenhouse/constants';
import { createHackerNewsAdapter } from '../lib/sources/hackernews/hackernews-adapter';
import { createHimalayasAdapter } from '../lib/sources/himalayas/himalayas-adapter';
import { createJobicyAdapter } from '../lib/sources/jobicy/jobicy-adapter';
import { createLeverAdapter } from '../lib/sources/lever/lever-adapter';
import { LEVER_BOARD_SLUGS } from '../lib/sources/lever/constants';
import { createQuaveAdapter } from '../lib/sources/quave/quave-adapter';
import { createYCombinatorAdapter } from '../lib/sources/ycombinator/ycombinator-adapter';

const MAX_CONFIGURED_BOARDS = 100;
const SENTRY_FLUSH_TIMEOUT_MS = 5_000;

const companyNamesByBoard = (boards: FetchBoard[]): Record<string, string> =>
  Object.fromEntries(
    boards.flatMap(({ slug, companyName }) =>
      companyName ? [[slug, companyName]] : [],
    ),
  );

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

export const reportIngestCrash = (
  error: unknown,
  captureException: typeof Sentry.captureException = Sentry.captureException,
): void => {
  captureException(error, {
    level: 'fatal',
    tags: { job: 'ingest' },
    fingerprint: ['ingest-fatal'],
  });
};

export const reportIngestionSourceFailures = (
  failed: Array<{ name: string; error: string; board?: string }>,
  captureException: typeof Sentry.captureException = Sentry.captureException,
): void => {
  failed.forEach((source) => {
    captureException(
      new Error(
        `Source ${source.name}${source.board ? ` board ${source.board}` : ''} failed: ${source.error}`,
      ),
      {
        tags: { job: 'ingest', source: source.name },
        fingerprint: [
          'ingest-source-failure',
          source.name,
          ...(source.board ? [source.board] : []),
        ],
      },
    );
  });
};

// pg aborts each statement at query_timeout. Request traffic keeps the 30s
// default. This job's transaction runs for up to ten minutes, and each
// statement uses that same budget.
export const createIngestionDb = () =>
  createDb(undefined, {
    queryTimeoutMs: INGESTION_TRANSACTION_TIMEOUT_MS,
  });

const main = async () => {
  const sentryEnabled = initIngestSentry();
  const db = createIngestionDb();
  try {
    const verified = await createAtsBoardsRepository(db).listVerified();
    const greenhouseBoards = buildFetchSet(
      'greenhouse',
      GREENHOUSE_BOARD_TOKENS,
      verified,
      MAX_CONFIGURED_BOARDS,
    );
    const ashbyBoards = buildFetchSet(
      'ashby',
      ASHBY_BOARD_NAMES,
      verified,
      MAX_CONFIGURED_BOARDS,
    );
    const leverBoards = buildFetchSet(
      'lever',
      LEVER_BOARD_SLUGS,
      verified,
      MAX_CONFIGURED_BOARDS,
    );
    const sources = [
      ...(greenhouseBoards.length > 0
        ? [
            createGreenhouseAdapter({
              boardTokens: greenhouseBoards.map(({ slug }) => slug),
              companyNamesByBoard: companyNamesByBoard(greenhouseBoards),
            }),
          ]
        : []),
      ...(ashbyBoards.length > 0
        ? [
            createAshbyAdapter({
              boardNames: ashbyBoards.map(({ slug }) => slug),
              companyNamesByBoard: companyNamesByBoard(ashbyBoards),
            }),
          ]
        : []),
      ...(leverBoards.length > 0
        ? [
            createLeverAdapter({
              boardSlugs: leverBoards.map(({ slug }) => slug),
              companyNamesByBoard: companyNamesByBoard(leverBoards),
            }),
          ]
        : []),
      createGetOnBrdAdapter(),
      createHackerNewsAdapter(),
      createHimalayasAdapter(),
      createJobicyAdapter(),
      createFrontendBrAdapter({ token: process.env.GITHUB_TOKEN }),
      createQuaveAdapter({ token: process.env.GITHUB_TOKEN }),
      createYCombinatorAdapter(),
    ];
    const result = await runIngestion({ db, sources });
    console.log(JSON.stringify(result, null, 2));

    const failedSources = result.sources.flatMap((source) =>
      source.error === undefined
        ? []
        : [{ name: source.name, error: source.error }],
    );
    const failedBoards = result.sources.flatMap((source) =>
      (source.failedBoards ?? []).map((failure) => ({
        name: source.name,
        board: failure.board,
        error: String(failure.status ?? failure.error),
      })),
    );
    const failed = [...failedSources, ...failedBoards];
    if (failed.length > 0) {
      reportIngestionSourceFailures(failed);
    }
    if (failedSources.length > 0) {
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
    reportIngestCrash(error);
    if (sentryEnabled) {
      await Sentry.flush(SENTRY_FLUSH_TIMEOUT_MS);
    }
    process.exitCode = 1;
  });
}

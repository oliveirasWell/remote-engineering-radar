import { createDb } from '../lib/db/client';
import { runIngestion } from '../lib/ingestion/run-ingestion';
import { createAshbyAdapter } from '../lib/sources/ashby/ashby-adapter';
import { createFrontendBrAdapter } from '../lib/sources/frontendbr/frontendbr-adapter';
import { createGetOnBrdAdapter } from '../lib/sources/getonbrd/getonbrd-adapter';
import { createGreenhouseAdapter } from '../lib/sources/greenhouse/greenhouse-adapter';
import { createHackerNewsAdapter } from '../lib/sources/hackernews/hackernews-adapter';
import { createHimalayasAdapter } from '../lib/sources/himalayas/himalayas-adapter';
import { createJobicyAdapter } from '../lib/sources/jobicy/jobicy-adapter';
import { createLeverAdapter } from '../lib/sources/lever/lever-adapter';

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const MAX_CONFIGURED_BOARDS = 100;

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
  ];

  const db = createDb();
  const result = await runIngestion({ db, sources });
  console.log(JSON.stringify(result, null, 2));

  const failed = result.sources.filter((source) => source.error);
  if (failed.length > 0) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

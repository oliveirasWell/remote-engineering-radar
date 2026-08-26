import { createDb } from '../lib/db/client';
import { runIngestion } from '../lib/ingestion/run-ingestion';
import { createAshbyAdapter } from '../lib/sources/ashby/ashby-adapter';
import { createGreenhouseAdapter } from '../lib/sources/greenhouse/greenhouse-adapter';
import { createHackerNewsAdapter } from '../lib/sources/hackernews/hackernews-adapter';

const splitList = (value: string | undefined): string[] =>
  (value ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

const main = async () => {
  const greenhouseBoards = splitList(process.env.GREENHOUSE_BOARD_TOKENS);
  const ashbyBoards = splitList(process.env.ASHBY_BOARD_NAMES);

  const sources = [
    ...(greenhouseBoards.length > 0
      ? [createGreenhouseAdapter({ boardTokens: greenhouseBoards })]
      : []),
    ...(ashbyBoards.length > 0
      ? [createAshbyAdapter({ boardNames: ashbyBoards })]
      : []),
    createHackerNewsAdapter(),
  ];

  if (sources.length === 0) {
    console.log('No sources configured; nothing to ingest.');
    return;
  }

  const db = createDb();
  const result = await runIngestion({ db, sources });
  console.log(JSON.stringify(result, null, 2));

  const failed = result.sources.filter((source) => source.error);
  if (failed.length === result.sources.length) {
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

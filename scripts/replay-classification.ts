/**
 * Dev-only, read-only. Measures what a classifier change does to real jobs:
 *
 *   --snapshot <file>  classify current inputs and store inputs + results
 *   --compare <file>   reclassify the stored inputs and print the diff
 *
 * Inputs are active DB rows (skipped with --feeds-only) and the live feeds of
 * the configured Greenhouse boards plus any given with --boards a,b. DB rows
 * are already persisted, so their stored remote policy is passed through and
 * only the other fields are meaningful; the feeds exercise the ingest gate.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import {
  classifyJob,
  shouldPersistClassifiedJob,
  type ClassifyJobInput,
} from '../lib/classification/classify-job';
import type { JobClassification } from '../lib/classification/types';
import { createDb, disconnectDb } from '../lib/db/client';
import { REMOTE_POLICY_REMOTE } from '../lib/jobs/constants';
import { createGreenhouseAdapter } from '../lib/sources/greenhouse/greenhouse-adapter';

type ReplayEntry = {
  key: string;
  origin: 'db' | 'feed';
  input: ClassifyJobInput;
  classification: JobClassification;
  persist: boolean;
};

const MAX_SAMPLES = 10;

const DIFF_FIELDS = [
  'seniority',
  'roleFocus',
  'geography',
  'remotePolicy',
] as const;

const classify = (input: ClassifyJobInput) => {
  const classification = classifyJob(input);
  return {
    classification,
    persist:
      shouldPersistClassifiedJob(classification) &&
      classification.remotePolicy === REMOTE_POLICY_REMOTE,
  };
};

const readDbInputs = async (): Promise<
  Omit<ReplayEntry, 'classification' | 'persist'>[]
> => {
  const db = createDb();
  try {
    const rows = await db.job.findMany({
      where: { isActive: true },
      select: {
        source: true,
        sourceJobId: true,
        title: true,
        description: true,
        location: true,
        remotePolicy: true,
      },
    });
    return rows.map((row) => ({
      key: `db:${row.source}:${row.sourceJobId}`,
      origin: 'db',
      input: {
        title: row.title,
        description: row.description ?? undefined,
        location: row.location ?? undefined,
        remotePolicy: row.remotePolicy ?? undefined,
      },
    }));
  } finally {
    await disconnectDb(db);
  }
};

const readFeedInputs = async (
  boards: string[],
): Promise<Omit<ReplayEntry, 'classification' | 'persist'>[]> => {
  const entries: Omit<ReplayEntry, 'classification' | 'persist'>[] = [];
  for (const board of boards) {
    try {
      const { jobs } = await createGreenhouseAdapter({
        boardTokens: [board],
      }).fetchJobs();
      for (const job of jobs) {
        entries.push({
          key: `feed:${board}:${job.sourceJobId}`,
          origin: 'feed',
          input: {
            title: job.title,
            description: job.description,
            location: job.location,
            remotePolicy: job.remotePolicy,
            technologies: job.technologies,
          },
        });
      }
    } catch (error) {
      console.error(`Skipping board ${board}: ${String(error)}`);
    }
  }
  return entries;
};

const snapshot = async (file: string, feedsOnly: boolean, boards: string[]) => {
  const inputs = [
    ...(feedsOnly ? [] : await readDbInputs()),
    ...(await readFeedInputs(boards)),
  ];
  const entries: ReplayEntry[] = inputs.map((entry) => ({
    ...entry,
    ...classify(entry.input),
  }));
  await writeFile(file, JSON.stringify(entries));
  console.log(`Snapshot of ${entries.length} jobs written to ${file}`);
};

const describe = (entry: ReplayEntry) =>
  `${entry.key} | ${entry.input.title} | ${entry.input.location ?? ''}`;

const compare = async (file: string) => {
  const entries = JSON.parse(await readFile(file, 'utf8')) as ReplayEntry[];
  const diffs = new Map<string, string[]>();
  const record = (category: string, line: string) => {
    diffs.set(category, [...(diffs.get(category) ?? []), line]);
  };

  for (const entry of entries) {
    const next = classify(entry.input);
    if (next.persist && !entry.persist) {
      record('newly persisted', describe(entry));
    }
    if (!next.persist && entry.persist) {
      record('newly dropped', describe(entry));
    }
    for (const field of DIFF_FIELDS) {
      const before = JSON.stringify(entry.classification[field] ?? null);
      const after = JSON.stringify(next.classification[field] ?? null);
      if (before !== after) {
        record(
          `${field} changed`,
          `${describe(entry)} | ${before} -> ${after}`,
        );
      }
    }
  }

  console.log(`Compared ${entries.length} jobs`);
  for (const [category, lines] of diffs) {
    console.log(`\n${category}: ${lines.length}`);
    for (const line of lines.slice(0, MAX_SAMPLES)) {
      console.log(`  ${line}`);
    }
  }
  if (diffs.size === 0) {
    console.log('No differences');
  }
};

const main = async () => {
  const { values } = parseArgs({
    options: {
      snapshot: { type: 'string' },
      compare: { type: 'string' },
      'feeds-only': { type: 'boolean', default: false },
      boards: { type: 'string', default: '' },
    },
  });
  const boards = [
    ...(process.env.GREENHOUSE_BOARD_TOKENS ?? '').split(','),
    ...values.boards.split(','),
  ]
    .map((board) => board.trim())
    .filter(Boolean);

  if (values.snapshot) {
    await snapshot(values.snapshot, values['feeds-only'], [...new Set(boards)]);
  } else if (values.compare) {
    await compare(values.compare);
  } else {
    throw new Error('Pass --snapshot <file> or --compare <file>');
  }
};

void main();

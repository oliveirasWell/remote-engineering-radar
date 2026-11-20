/**
 * One-off probe (SPEC-035 follow-up): how many Brazilian recruiting roles the
 * Jooble and Careerjet partner APIs return, and how many the radar would keep.
 * Prints counts and titles only; never the keys or request URLs.
 */
import { pathToFileURL } from 'node:url';
import { classifyJob } from '../lib/classification/classify-job';
import { RECRUITING_ROLE_FOCUS } from '../lib/classification/constants';

type Probe = {
  title: string;
  location?: string;
  description?: string;
  company?: string;
};

const QUERIES = [
  'recrutador',
  'tech recruiter',
  'talent acquisition',
  'analista de recrutamento',
];
const LOCATION = 'Brasil';

const strip = (html?: string) => html?.replaceAll(/<[^<>]*>/g, ' ');

type JoobleJob = {
  title: string;
  location?: string;
  snippet?: string;
  company?: string;
  updated?: string;
};

const DAY_MS = 86_400_000;

/** Age profile of `updated`, to see whether results come newest first. */
const ageProfile = (jobs: JoobleJob[]) => {
  const ages = jobs
    .flatMap((job) =>
      job.updated ? [Date.now() - Date.parse(job.updated)] : [],
    )
    .map((ms) => Math.round(ms / DAY_MS));
  const sorted = ages.toSorted((a, b) => a - b);
  return `ageDays min=${sorted[0] ?? '?'} median=${sorted[Math.floor(sorted.length / 2)] ?? '?'} max=${sorted.at(-1) ?? '?'} within3d=${ages.filter((age) => age <= 3).length}/${ages.length} firstFive=${ages.slice(0, 5).join(',')}`;
};

const joobleSearch = async (key: string, body: Record<string, unknown>) => {
  const response = await fetch(`https://br.jooble.org/api/${key}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    return { status: response.status, jobs: [] as JoobleJob[], total: 0 };
  }
  const json = (await response.json()) as {
    totalCount?: number;
    jobs?: JoobleJob[];
  };
  return { status: 200, jobs: json.jobs ?? [], total: json.totalCount };
};

const probeJooble = async (key: string) => {
  const since = new Date(Date.now() - 3 * DAY_MS).toISOString().slice(0, 10);
  const variants: Array<[string, Record<string, unknown>]> = [
    ['page1', { page: 1 }],
    ['page2', { page: 2 }],
    ['datecreatedfrom', { page: 1, datecreatedfrom: since }],
    ['SearchMode=1', { page: 1, SearchMode: 1 }],
    ['SearchMode=2', { page: 1, SearchMode: 2 }],
  ];
  for (const keywords of ['recrutador', 'tech recruiter']) {
    for (const [name, extra] of variants) {
      const { status, jobs, total } = await joobleSearch(key, {
        keywords,
        location: LOCATION,
        ResultOnPage: 50,
        ...extra,
      });
      console.info(
        `jooble "${keywords}" ${name}: HTTP ${status} total=${String(total)} ${ageProfile(jobs)}`,
      );
    }
  }
  const lane = new Map<string, Probe>();
  for (const keywords of QUERIES) {
    for (const page of [1, 2]) {
      const { jobs } = await joobleSearch(key, {
        keywords,
        location: LOCATION,
        ResultOnPage: 50,
        page,
      });
      jobs.forEach((job) =>
        lane.set(`${job.title}|${job.company ?? ''}`, {
          title: job.title,
          location: job.location,
          description: strip(job.snippet),
          company: job.company,
        }),
      );
    }
  }
  const onLane = [...lane.values()].filter((job) =>
    classifyJob(job).roleFocus.includes(RECRUITING_ROLE_FOCUS),
  );
  console.info(`jooble lane titles (${onLane.length} unique of ${lane.size}):`);
  onLane.forEach((job) =>
    console.info(`  ~ ${job.title} | ${job.company ?? '?'}`),
  );
};

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const run = async () => {
    const userIp = (await (await fetch('https://api.ipify.org')).text()).trim();
    const jooble = process.env.JOOBLE_API_KEY;
    const careerjet = process.env.CAREERJET_API_KEY;
    if (jooble) {
      await probeJooble(jooble);
    } else {
      console.info('jooble: JOOBLE_API_KEY not set');
    }
    // Careerjet needs an allow-listed fixed IP; skipped until one exists.
    console.info(
      `careerjet: skipped (${careerjet ? 'key set' : 'no key'}, ${userIp ? 'ip known' : 'no ip'})`,
    );
  };
  run().catch((error) => {
    console.error(
      'Probe failed:',
      error instanceof Error ? error.name : 'Error',
    );
    process.exitCode = 1;
  });
}

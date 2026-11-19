/**
 * One-off probe (SPEC-035 follow-up): how many Brazilian recruiting roles the
 * Jooble and Careerjet partner APIs return, and how many the radar would keep.
 * Prints counts and titles only; never the keys or request URLs.
 */
import { pathToFileURL } from 'node:url';
import {
  classifyJob,
  shouldPersistClassifiedJob,
} from '../lib/classification/classify-job';
import { RECRUITING_ROLE_FOCUS } from '../lib/classification/constants';
import { resolveJobCountries } from '../lib/jobs/countries';
import {
  defaultWorkModel,
  isKeptWorkModel,
} from '../lib/jobs/work-model/is-kept-work-model';

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
const USER_AGENT =
  'RemoteEngineeringRadar/1.0 (+https://remote-engineering-radar.vercel.app)';

const summarize = (label: string, jobs: Probe[], total: unknown) => {
  const rows = jobs.map((job) => {
    const classification = classifyJob(job);
    const countries = resolveJobCountries({ location: job.location });
    const workModel =
      classification.remotePolicy ?? defaultWorkModel(countries);
    return {
      job,
      lane: classification.roleFocus.includes(RECRUITING_ROLE_FOCUS),
      kept:
        shouldPersistClassifiedJob(classification) &&
        isKeptWorkModel(workModel, countries),
      workModel: workModel ?? 'unknown',
    };
  });
  const onLane = rows.filter((row) => row.lane);
  const keptOnLane = onLane.filter((row) => row.kept);
  const byModel = Object.fromEntries(
    Object.entries(Object.groupBy(keptOnLane, (row) => row.workModel)).map(
      ([model, group]) => [model, group?.length ?? 0],
    ),
  );
  console.info(
    `${label}: total=${String(total)} fetched=${rows.length} recruitingLane=${onLane.length} keptOnLane=${keptOnLane.length} ${JSON.stringify(byModel)}`,
  );
  onLane
    .slice(0, 5)
    .forEach((row) =>
      console.info(
        `  - ${row.job.title} | ${row.job.company ?? '?'} | ${row.job.location ?? '?'} | ${row.workModel}`,
      ),
    );
};

const strip = (html?: string) => html?.replaceAll(/<[^<>]*>/g, ' ');

const probeJooble = async (key: string) => {
  for (const host of [
    'https://br.jooble.org/api/',
    'https://jooble.org/api/',
  ]) {
    for (const keywords of QUERIES) {
      const response = await fetch(`${host}${key}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          keywords,
          location: LOCATION,
          page: '1',
          ResultOnPage: '50',
        }),
      });
      const label = `jooble ${new URL(host).host} "${keywords}"`;
      if (!response.ok) {
        console.info(`${label}: HTTP ${response.status}`);
        continue;
      }
      const body = (await response.json()) as {
        totalCount?: number;
        jobs?: Array<{
          title: string;
          location?: string;
          snippet?: string;
          company?: string;
        }>;
      };
      summarize(
        label,
        (body.jobs ?? []).map((job) => ({
          title: job.title,
          location: job.location,
          description: strip(job.snippet),
          company: job.company,
        })),
        body.totalCount,
      );
    }
  }
};

const probeCareerjet = async (key: string, userIp: string) => {
  for (const keywords of QUERIES) {
    const params = new URLSearchParams({
      locale_code: 'pt_BR',
      keywords,
      location: LOCATION,
      page: '1',
      page_size: '50',
      user_ip: userIp,
      user_agent: USER_AGENT,
    });
    const v4 = await fetch(
      `https://search.api.careerjet.net/v4/query?${params}`,
      {
        headers: {
          authorization: `Basic ${Buffer.from(`${key}:`).toString('base64')}`,
          referer: 'https://remote-engineering-radar.vercel.app/',
        },
      },
    );
    const label = `careerjet v4 "${keywords}"`;
    if (!v4.ok) {
      console.info(`${label}: HTTP ${v4.status}`);
      continue;
    }
    const body = (await v4.json()) as {
      hits?: number;
      jobs?: Array<{
        title: string;
        locations?: string;
        description?: string;
        company?: string;
      }>;
    };
    summarize(
      label,
      (body.jobs ?? []).map((job) => ({
        title: job.title,
        location: job.locations,
        description: strip(job.description),
        company: job.company,
      })),
      body.hits,
    );
  }
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
    if (careerjet) {
      await probeCareerjet(careerjet, userIp);
    } else {
      console.info('careerjet: CAREERJET_API_KEY not set');
    }
  };
  run().catch((error) => {
    console.error(
      'Probe failed:',
      error instanceof Error ? error.name : 'Error',
    );
    process.exitCode = 1;
  });
}

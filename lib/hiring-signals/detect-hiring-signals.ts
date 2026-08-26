import {
  HIRING_SIGNAL_TYPES,
  MULTIPLE_OPENINGS_THRESHOLD,
  RECENT_HIRING_WINDOW_MS,
  RECENT_OPENINGS_THRESHOLD,
  RELEVANT_TECH_JOB_THRESHOLD,
} from './constants';
import type {
  DetectHiringSignalsResult,
  HiringSignalDetection,
  HiringSignalJobInput,
} from './detect-types';

const RELEVANT_TECHS = new Set([
  'React',
  'TypeScript',
  'Node.js',
  'GraphQL',
  'React Native',
]);

const isEngineeringJob = (job: HiringSignalJobInput): boolean => {
  const title = job.title.toLowerCase();
  return (
    /\bengineer\b|\bdeveloper\b|\bsoftware\b|\bfrontend\b|\bbackend\b|\bfullstack\b|\bmobile\b/.test(
      title,
    ) || job.technologies.some((tech) => RELEVANT_TECHS.has(tech))
  );
};

const isLeadershipJob = (job: HiringSignalJobInput): boolean =>
  /\b(staff|principal|engineering manager|head of engineering|director of engineering|tech lead)\b/i.test(
    job.title,
  );

const roleBuckets = (job: HiringSignalJobInput) => {
  const title = job.title.toLowerCase();
  const techs = job.technologies.join(' ').toLowerCase();
  const haystack = `${title} ${techs}`;
  return {
    frontend: /\bfront[-\s]?end\b|\breact\b(?!\s*native)/i.test(haystack),
    backend: /\bback[-\s]?end\b|\bnode\.?js\b|\bgraphql\b/i.test(haystack),
    mobile: /\bmobile\b|\breact native\b|\bexpo\b/i.test(haystack),
  };
};

const jobTimestamp = (job: HiringSignalJobInput): Date | undefined =>
  job.postedAt ?? job.firstSeenAt ?? undefined;

export const detectHiringSignals = (input: {
  companyName: string;
  jobs: HiringSignalJobInput[];
  now?: Date;
}): DetectHiringSignalsResult => {
  const now = input.now ?? new Date();
  const activeJobs = input.jobs.filter((job) => job.isActive !== false);
  const engineeringJobs = activeJobs.filter(isEngineeringJob);
  const signals: HiringSignalDetection[] = [];

  if (engineeringJobs.length >= MULTIPLE_OPENINGS_THRESHOLD) {
    signals.push({
      type: HIRING_SIGNAL_TYPES.MULTIPLE_ENGINEERING_OPENINGS,
      description: `Company currently has ${engineeringJobs.length} engineering positions open.`,
      score: engineeringJobs.length >= 7 ? 25 : 15,
    });
  }

  const recentJobs = engineeringJobs.filter((job) => {
    const timestamp = jobTimestamp(job);
    if (!timestamp) {
      return false;
    }
    return now.getTime() - timestamp.getTime() <= RECENT_HIRING_WINDOW_MS;
  });

  if (recentJobs.length >= RECENT_OPENINGS_THRESHOLD) {
    signals.push({
      type: HIRING_SIGNAL_TYPES.RECENT_ENGINEERING_HIRING,
      description: `${recentJobs.length} engineering positions opened in the last 30 days.`,
      score: 20,
    });
  }

  const relevantTechJobs = engineeringJobs.filter((job) =>
    job.technologies.some((tech) => RELEVANT_TECHS.has(tech)),
  );
  if (relevantTechJobs.length >= RELEVANT_TECH_JOB_THRESHOLD) {
    signals.push({
      type: HIRING_SIGNAL_TYPES.RELEVANT_TECHNOLOGY_CLUSTER,
      description: `${relevantTechJobs.length} open roles involve React/TypeScript/Node hiring.`,
      score: 15,
    });
  }

  const buckets = engineeringJobs.map(roleBuckets);
  const hasFrontend = buckets.some((bucket) => bucket.frontend);
  const hasBackend = buckets.some((bucket) => bucket.backend);
  const hasMobile = buckets.some((bucket) => bucket.mobile);
  const activeBuckets = [hasFrontend, hasBackend, hasMobile].filter(
    Boolean,
  ).length;
  if (activeBuckets >= 2) {
    signals.push({
      type: HIRING_SIGNAL_TYPES.CROSS_FUNCTION_ENGINEERING_HIRING,
      description:
        'Simultaneous frontend/backend/mobile engineering hiring detected.',
      score: 15,
    });
  }

  const leadershipJobs = engineeringJobs.filter(isLeadershipJob);
  if (leadershipJobs.length > 0) {
    signals.push({
      type: HIRING_SIGNAL_TYPES.ENGINEERING_LEADERSHIP_HIRING,
      description: `${leadershipJobs.length} engineering leadership role(s) currently open.`,
      score: 10,
    });
  }

  const hiringScore = signals.reduce(
    (total, signal) => total + signal.score,
    0,
  );
  const summary =
    hiringScore >= 40
      ? 'Strong hiring signal'
      : hiringScore > 0
        ? 'Company is actively expanding engineering hiring.'
        : 'No strong engineering hiring signal detected.';

  return { signals, hiringScore, summary };
};

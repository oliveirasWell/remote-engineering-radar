import {
  classifyJob,
  shouldPersistClassifiedJob,
} from '@/lib/classification/classify-job';
import type { Db } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { normalizeCompanyName } from '@/lib/deduplication/normalize';
import { deduplicateJobs } from '@/lib/deduplication/deduplicate-jobs';
import { detectHiringSignals } from '@/lib/hiring-signals/detect-hiring-signals';
import { JOB_MAX_AGE_MS } from '@/lib/jobs/constants';
import { scoreClassifiedJob } from '@/lib/scoring/score-job';
import type { JobSource, NormalizedJob } from '@/lib/sources/types';
import { isSafeExternalUrl } from '@/lib/urls/external-url';

export type IngestionLogger = {
  info: (message: string) => void;
  error: (message: string) => void;
};

export type IngestionSourceResult = {
  name: string;
  fetched: number;
  error?: string;
};

export type IngestionResult = {
  sources: IngestionSourceResult[];
  persistedJobs: number;
  companiesUpdated: number;
};

type EnrichedJob = NormalizedJob & {
  score: number;
  geographies: ReturnType<typeof classifyJob>['geography'];
  shouldPersist: boolean;
};

const toSlug = (name: string): string =>
  normalizeCompanyName(name).replaceAll(' ', '-') || 'unknown-company';

const isPostedBeyondMaxAge = (
  job: NormalizedJob,
  now: Date,
  maxAgeMs: number,
): boolean => {
  if (!job.postedAt) {
    return false;
  }
  return now.getTime() - job.postedAt.getTime() > maxAgeMs;
};

const enrichJob = (job: NormalizedJob, now: Date): EnrichedJob => {
  const classification = classifyJob({
    title: job.title,
    description: job.description,
    location: job.location,
    remotePolicy: job.remotePolicy,
    technologies: job.technologies,
  });
  const scored = scoreClassifiedJob(classification, job.seniority);

  return {
    ...job,
    technologies: classification.technologies,
    seniority: classification.seniority ?? job.seniority,
    remotePolicy: classification.remotePolicy ?? job.remotePolicy,
    score: scored.score,
    geographies: classification.geography,
    shouldPersist:
      shouldPersistClassifiedJob(classification) &&
      !isPostedBeyondMaxAge(job, now, JOB_MAX_AGE_MS),
  };
};

export const runIngestion = async (options: {
  db: Db;
  sources: JobSource[];
  logger?: IngestionLogger;
  completedAt?: () => Date;
  now?: () => Date;
}): Promise<IngestionResult> => {
  const logger = options.logger ?? {
    info: (message: string) => console.log(message),
    error: (message: string) => console.error(message),
  };
  const now = options.now?.() ?? new Date();

  const sourceResults: IngestionSourceResult[] = [];
  const fetchedJobs: NormalizedJob[] = [];

  for (const source of options.sources) {
    try {
      const jobs = await source.fetchJobs();
      fetchedJobs.push(...jobs);
      sourceResults.push({ name: source.name, fetched: jobs.length });
      logger.info(`Source ${source.name}: fetched ${jobs.length} jobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sourceResults.push({ name: source.name, fetched: 0, error: message });
      logger.error(`Source ${source.name} failed: ${message}`);
    }
  }

  const enriched = fetchedJobs
    .filter((job) => isSafeExternalUrl(job.url))
    .map((job) => enrichJob(job, now));
  const persistable = enriched.filter((job) => job.shouldPersist);
  const { jobs: uniqueJobs } = deduplicateJobs(persistable);

  const { persistedJobs, companiesUpdated } = await options.db.transaction(
    async (tx) => {
      const transactionDb = tx as unknown as Db;
      const companiesRepository = createCompaniesRepository(transactionDb);
      const jobsRepository = createJobsRepository(transactionDb);
      const hiringSignalsRepository =
        createHiringSignalsRepository(transactionDb);
      const ingestionRunsRepository =
        createIngestionRunsRepository(transactionDb);
      const companyIds = new Set<string>();
      let persistedJobs = 0;

      for (const job of uniqueJobs) {
        const slug = toSlug(job.company.name);
        const company = await companiesRepository.upsertBySlug({
          name: job.company.name,
          slug,
          websiteUrl: isSafeExternalUrl(job.company.websiteUrl)
            ? job.company.websiteUrl
            : undefined,
          source: job.source,
        });
        companyIds.add(company.id);

        const scoredJob = job as EnrichedJob;
        await jobsRepository.upsertBySourceJobId({
          companyId: company.id,
          source: job.source,
          sourceJobId: job.sourceJobId,
          title: job.title,
          url: job.url,
          location: job.location,
          remotePolicy: job.remotePolicy,
          description: job.description,
          technologies: job.technologies,
          geographies: scoredJob.geographies,
          seniority: job.seniority,
          score: scoredJob.score,
          postedAt: job.postedAt,
          isActive: true,
        });
        persistedJobs += 1;
      }

      for (const sourceResult of sourceResults) {
        if (sourceResult.error) {
          continue;
        }

        const sourceJobIds = uniqueJobs
          .filter((job) => job.source === sourceResult.name)
          .map((job) => job.sourceJobId);
        const deactivatedJobs = await jobsRepository.deactivateMissingBySource(
          sourceResult.name,
          sourceJobIds,
        );
        for (const job of deactivatedJobs) {
          companyIds.add(job.companyId);
        }
      }

      const agedOut = await jobsRepository.deactivateOlderThan(
        JOB_MAX_AGE_MS,
        now,
      );
      for (const job of agedOut) {
        companyIds.add(job.companyId);
      }

      let companiesUpdated = 0;
      for (const companyId of companyIds) {
        const companyJobs = await jobsRepository.listByCompanyId(companyId);
        const detection = detectHiringSignals({
          companyName: companyId,
          jobs: companyJobs.map((job) => ({
            title: job.title,
            technologies: job.technologies,
            postedAt: job.postedAt,
            firstSeenAt: job.firstSeenAt,
            isActive: job.isActive,
            sourceUrl: isSafeExternalUrl(job.url) ? job.url : undefined,
          })),
          now,
        });

        await hiringSignalsRepository.replaceForCompany(
          companyId,
          detection.signals.map((signal) => ({
            companyId,
            type: signal.type,
            description: signal.description,
            sourceUrl: signal.sourceUrl,
            score: signal.score,
          })),
          detection.hiringScore,
        );
        companiesUpdated += 1;
      }

      await ingestionRunsRepository.record({
        completedAt: options.completedAt?.(),
        persistedJobs,
        companiesUpdated,
      });

      return { persistedJobs, companiesUpdated };
    },
  );

  logger.info(
    `Ingestion complete: ${persistedJobs} jobs across ${companiesUpdated} companies`,
  );

  return {
    sources: sourceResults,
    persistedJobs,
    companiesUpdated,
  };
};

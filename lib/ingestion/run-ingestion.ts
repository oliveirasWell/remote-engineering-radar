import {
  classifyJob,
  shouldPersistClassifiedJob,
} from '@/lib/classification/classify-job';
import type { NewCompany } from '@/lib/companies/types';
import type { RootDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { normalizeCompanyName } from '@/lib/deduplication/normalize';
import { deduplicateJobs } from '@/lib/deduplication/deduplicate-jobs';
import { detectHiringSignals } from '@/lib/hiring-signals/detect-hiring-signals';
import { INGESTION_TRANSACTION_TIMEOUT_MS } from '@/lib/ingestion/constants';
import { resolveJobCountries } from '@/lib/jobs/countries';
import {
  JOB_MAX_AGE_MS,
  JOB_RETENTION_MS,
  REMOTE_POLICY_REMOTE,
} from '@/lib/jobs/constants';
import { scoreClassifiedJob } from '@/lib/scoring/score-job';
import type { JobCard } from '@/lib/jobs/types';
import type { JobSource, NormalizedJob } from '@/lib/sources/types';
import { isSafeExternalUrl } from '@/lib/urls/external-url';

export type IngestionLogger = {
  info: (message: string) => void;
  error: (message: string) => void;
};

export type IngestionSourceResult = {
  name: string;
  fetched: number;
  persisted: number;
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
  countries: string[];
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
  const remotePolicy = classification.remotePolicy ?? job.remotePolicy;
  const geographies = classification.geography;
  const countries = resolveJobCountries({
    sourceCountries: job.countries,
    location: job.location,
    geographies,
  });

  return {
    ...job,
    technologies: classification.technologies,
    seniority: classification.seniority ?? job.seniority,
    remotePolicy,
    score: scored.score,
    geographies,
    countries,
    shouldPersist:
      shouldPersistClassifiedJob(classification) &&
      remotePolicy === REMOTE_POLICY_REMOTE &&
      !isPostedBeyondMaxAge(job, now, JOB_MAX_AGE_MS),
  };
};

export const runIngestion = async (options: {
  db: RootDb;
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
  const completeSources = new Set<string>();

  for (const source of options.sources) {
    try {
      const { jobs, complete } = await source.fetchJobs();
      fetchedJobs.push(...jobs);
      if (complete) {
        completeSources.add(source.name);
      }
      sourceResults.push({
        name: source.name,
        fetched: jobs.length,
        persisted: 0,
      });
      logger.info(`Source ${source.name}: fetched ${jobs.length} jobs`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      sourceResults.push({
        name: source.name,
        fetched: 0,
        persisted: 0,
        error: message,
      });
      logger.error(`Source ${source.name} failed: ${message}`);
    }
  }

  const enriched = fetchedJobs
    .filter((job) => isSafeExternalUrl(job.url))
    .map((job) => enrichJob(job, now));
  const persistable = enriched.filter((job) => job.shouldPersist);
  const { jobs: uniqueJobs } = deduplicateJobs(persistable);

  const companyInputsBySlug = new Map<string, NewCompany>();
  for (const job of uniqueJobs) {
    const slug = toSlug(job.company.name);
    // Match sequential upserts: last name/source wins, but only safe URLs
    // replace websites.
    companyInputsBySlug.set(slug, {
      name: job.company.name,
      slug,
      websiteUrl: isSafeExternalUrl(job.company.websiteUrl)
        ? job.company.websiteUrl
        : companyInputsBySlug.get(slug)?.websiteUrl,
      source: job.source,
    });
  }

  const persistedBySource = new Map<string, number>();

  const { persistedJobs, companiesUpdated } = await options.db.$transaction(
    async (tx) => {
      const companiesRepository = createCompaniesRepository(tx);
      const jobsRepository = createJobsRepository(tx);
      const hiringSignalsRepository = createHiringSignalsRepository(tx);
      const ingestionRunsRepository = createIngestionRunsRepository(tx);
      const companyIds = new Set<string>();
      const companyIdsBySlug = new Map<string, string>();
      let persistedJobs = 0;

      for (const input of companyInputsBySlug.values()) {
        const company = await companiesRepository.upsertBySlug(input);
        companyIdsBySlug.set(input.slug, company.id);
        companyIds.add(company.id);
      }

      for (const job of uniqueJobs) {
        const scoredJob = job as EnrichedJob;
        await jobsRepository.upsertBySourceJobId({
          companyId: companyIdsBySlug.get(toSlug(job.company.name))!,
          source: job.source,
          sourceJobId: job.sourceJobId,
          title: job.title,
          url: job.url,
          location: job.location,
          remotePolicy: job.remotePolicy,
          description: job.description,
          technologies: job.technologies,
          geographies: scoredJob.geographies,
          countries: scoredJob.countries,
          seniority: job.seniority,
          score: scoredJob.score,
          postedAt: job.postedAt,
          isActive: true,
        });
        persistedJobs += 1;
        persistedBySource.set(
          job.source,
          (persistedBySource.get(job.source) ?? 0) + 1,
        );
      }

      for (const sourceResult of sourceResults) {
        if (sourceResult.error !== undefined) {
          continue;
        }

        const sourceJobIds = new Set(
          uniqueJobs
            .filter((job) => job.source === sourceResult.name)
            .map((job) => job.sourceJobId),
        );
        // Partial feeds can retire observed ineligible jobs and duplicates,
        // but only complete snapshots can retire jobs that were not observed.
        const deactivatedJobs = completeSources.has(sourceResult.name)
          ? await jobsRepository.deactivateMissingBySource(sourceResult.name, [
              ...sourceJobIds,
            ])
          : await jobsRepository.deactivateBySourceJobIds(
              sourceResult.name,
              fetchedJobs
                .filter(
                  (job) =>
                    job.source === sourceResult.name &&
                    !sourceJobIds.has(job.sourceJobId),
                )
                .map((job) => job.sourceJobId),
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

      await jobsRepository.deleteInactiveOlderThan(JOB_RETENTION_MS, now);

      // One batched read instead of one query per touched company, and
      // without the description column, which signal detection never reads.
      const jobsByCompany = new Map<string, JobCard[]>();
      for (const job of await jobsRepository.listCardsByCompanyIds([
        ...companyIds,
      ])) {
        const existing = jobsByCompany.get(job.companyId);
        if (existing) {
          existing.push(job);
        } else {
          jobsByCompany.set(job.companyId, [job]);
        }
      }

      let companiesUpdated = 0;
      for (const companyId of companyIds) {
        const companyJobs = jobsByCompany.get(companyId) ?? [];
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
    { timeout: INGESTION_TRANSACTION_TIMEOUT_MS },
  );

  const sources = sourceResults.map((source) => ({
    ...source,
    persisted: persistedBySource.get(source.name) ?? 0,
  }));

  logger.info(
    `Ingestion complete: ${persistedJobs} jobs across ${companiesUpdated} companies`,
  );

  return {
    sources,
    persistedJobs,
    companiesUpdated,
  };
};

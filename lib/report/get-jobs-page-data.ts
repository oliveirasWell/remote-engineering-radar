import { cacheLife } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import type { JobCard } from '@/lib/jobs/types';
import { JOB_MAX_AGE_MS, REMOTE_POLICY_REMOTE } from '@/lib/jobs/constants';
import { scoreJob } from '@/lib/scoring/score-job';
import { REPORT_CACHE_LIFE, REPORT_ERROR_MESSAGE } from './constants';
import { logReportError } from './log-report-error';
import type { ReportJobCard, ReportJobDetail } from './types';

export type JobFilters = {
  technology?: string;
  seniority?: string;
  remote?: string;
  country?: string;
  minimumScore?: number;
  limit?: number;
};

export type JobsPageData = {
  jobs: ReportJobCard[];
  errorMessage?: string;
};

export type JobDetailData = {
  job: ReportJobDetail | null;
  errorMessage?: string;
};

const toJobCard = (
  job: JobCard,
  companyName: string | null,
): ReportJobCard => ({
  id: job.id,
  title: job.title,
  companyName,
  companyId: job.companyId,
  technologies: job.technologies,
  location: job.location,
  remotePolicy: job.remotePolicy,
  score: job.score,
  postedAt: job.postedAt,
  url: job.url,
});

export const getJobsPageData = async (
  filters: JobFilters = {},
): Promise<JobsPageData> => {
  'use cache';
  cacheLife(REPORT_CACHE_LIFE);

  try {
    const db = getDb();
    const jobsRepository = createJobsRepository(db);
    const companiesRepository = createCompaniesRepository(db);

    const jobs = await jobsRepository.listActiveByScore({
      technology: filters.technology,
      seniority: filters.seniority,
      remotePolicy: filters.remote ?? REMOTE_POLICY_REMOTE,
      country: filters.country,
      minimumScore: filters.minimumScore ?? 0,
      limit: filters.limit,
      maxAgeMs: JOB_MAX_AGE_MS,
    });

    const companies = await companiesRepository.listByIds([
      ...new Set(jobs.map((job) => job.companyId)),
    ]);
    const companyNames = new Map(
      companies.map((company) => [company.id, company.name]),
    );

    return {
      jobs: jobs.map((job) =>
        toJobCard(job, companyNames.get(job.companyId) ?? null),
      ),
    };
  } catch (error) {
    logReportError('jobs', error);
    return { jobs: [], errorMessage: REPORT_ERROR_MESSAGE };
  }
};

export const getJobDetailData = async (id: string): Promise<JobDetailData> => {
  'use cache';
  cacheLife(REPORT_CACHE_LIFE);

  try {
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      return { job: null };
    }

    const db = getDb();
    const jobsRepository = createJobsRepository(db);
    const companiesRepository = createCompaniesRepository(db);
    const job = await jobsRepository.findById(id);
    const now = new Date();
    const isRecent =
      job &&
      job.isActive &&
      job.remotePolicy === REMOTE_POLICY_REMOTE &&
      now.getTime() - (job.postedAt ?? job.firstSeenAt).getTime() <=
        JOB_MAX_AGE_MS;

    if (!job || !isRecent) {
      return { job: null };
    }

    const company = await companiesRepository.findById(job.companyId);
    // Only the detail page reads the description, and only for one job.
    const scored = scoreJob({
      title: job.title,
      description: job.description ?? undefined,
      location: job.location ?? undefined,
      remotePolicy: job.remotePolicy ?? undefined,
      technologies: job.technologies,
      seniority: job.seniority ?? undefined,
    });

    return {
      job: {
        ...toJobCard(job, company?.name ?? null),
        reasons: scored.reasons,
      },
    };
  } catch (error) {
    logReportError('job detail', error);
    return { job: null, errorMessage: REPORT_ERROR_MESSAGE };
  }
};

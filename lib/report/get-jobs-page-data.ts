import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { scoreJob } from '@/lib/scoring/score-job';
import { REPORT_ERROR_MESSAGE } from './constants';
import type { ReportJobCard } from './types';

export type JobFilters = {
  technology?: string;
  seniority?: string;
  remote?: string;
  location?: string;
  minimumScore?: number;
  limit?: number;
};

export type JobsPageData = {
  jobs: ReportJobCard[];
  errorMessage?: string;
};

export type JobDetailData = {
  job: ReportJobCard | null;
  errorMessage?: string;
};

const toJobCard = (
  job: Awaited<
    ReturnType<ReturnType<typeof createJobsRepository>['listActiveByScore']>
  >[number],
  companyName: string,
): ReportJobCard => {
  const scored = scoreJob({
    title: job.title,
    description: job.description ?? undefined,
    location: job.location ?? undefined,
    remotePolicy: job.remotePolicy ?? undefined,
    technologies: job.technologies,
  });

  return {
    id: job.id,
    title: job.title,
    companyName,
    companyId: job.companyId,
    technologies: job.technologies,
    location: job.location,
    remotePolicy: job.remotePolicy,
    score: job.score,
    reasons: scored.reasons,
    postedAt: job.postedAt,
    url: job.url,
  };
};

export const getJobsPageData = async (
  filters: JobFilters = {},
): Promise<JobsPageData> => {
  try {
    const db = getDb();
    const jobsRepository = createJobsRepository(db);
    const companiesRepository = createCompaniesRepository(db);

    const jobs = await jobsRepository.listActiveByScore({
      technology: filters.technology,
      seniority: filters.seniority,
      remotePolicy: filters.remote,
      location: filters.location,
      minimumScore: filters.minimumScore ?? 0,
      limit: filters.limit,
    });

    const companyNames = new Map<string, string>();
    const cards: ReportJobCard[] = [];

    for (const job of jobs) {
      let companyName = companyNames.get(job.companyId);
      if (!companyName) {
        const company = await companiesRepository.findById(job.companyId);
        companyName = company?.name ?? 'Unknown company';
        companyNames.set(job.companyId, companyName);
      }
      cards.push(toJobCard(job, companyName));
    }

    return { jobs: cards };
  } catch {
    return { jobs: [], errorMessage: REPORT_ERROR_MESSAGE };
  }
};

export const getJobDetailData = async (id: string): Promise<JobDetailData> => {
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

    if (!job || !job.isActive) {
      return { job: null };
    }

    const company = await companiesRepository.findById(job.companyId);
    return {
      job: toJobCard(job, company?.name ?? 'Unknown company'),
    };
  } catch {
    return { job: null, errorMessage: REPORT_ERROR_MESSAGE };
  }
};

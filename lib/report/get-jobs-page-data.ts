import { createDb } from '@/lib/db/client';
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
    const db = createDb();
    const jobsRepository = createJobsRepository(db);
    const companiesRepository = createCompaniesRepository(db);

    const jobs = await jobsRepository.listActiveByScore({
      technology: filters.technology,
      seniority: filters.seniority,
      remotePolicy: filters.remote,
      location: filters.location,
      minimumScore: filters.minimumScore ?? 0,
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
    const db = createDb();
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

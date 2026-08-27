import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { scoreJob } from '@/lib/scoring/score-job';
import {
  HOME_COMPANIES_LIMIT,
  HOME_JOBS_LIMIT,
  MINIMUM_JOB_SCORE_FOR_REPORT,
  REPORT_ERROR_MESSAGE,
} from './constants';
import type { HomeReport, ReportCompanyCard, ReportJobCard } from './types';

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

export const getHomeReport = async (): Promise<HomeReport> => {
  try {
    const db = getDb();
    const jobsRepository = createJobsRepository(db);
    const companiesRepository = createCompaniesRepository(db);
    const hiringSignalsRepository = createHiringSignalsRepository(db);

    const [jobs, companies] = await Promise.all([
      jobsRepository.listActiveByScore({
        limit: HOME_JOBS_LIMIT,
        minimumScore: MINIMUM_JOB_SCORE_FOR_REPORT,
      }),
      companiesRepository.listByHiringScore({
        limit: HOME_COMPANIES_LIMIT,
        minimumHiringScore: 0,
      }),
    ]);

    const companyNames = new Map<string, string>();
    for (const company of companies) {
      companyNames.set(company.id, company.name);
    }

    for (const job of jobs) {
      if (!companyNames.has(job.companyId)) {
        const company = await companiesRepository.findById(job.companyId);
        if (company) {
          companyNames.set(company.id, company.name);
        }
      }
    }

    const jobCards = jobs.map((job) =>
      toJobCard(job, companyNames.get(job.companyId) ?? 'Unknown company'),
    );

    const companyCards: ReportCompanyCard[] = [];
    for (const company of companies) {
      const [signals, companyJobs] = await Promise.all([
        hiringSignalsRepository.listByCompanyId(company.id),
        jobsRepository.listByCompanyId(company.id),
      ]);
      const openEngineeringJobs = companyJobs.filter(
        (job) => job.isActive,
      ).length;
      companyCards.push({
        id: company.id,
        name: company.name,
        slug: company.slug,
        hiringScore: company.hiringScore,
        summary:
          company.hiringScore >= 40
            ? 'Strong hiring signal'
            : 'Company is actively expanding engineering hiring.',
        signalDescriptions: signals.map((signal) => signal.description),
        websiteUrl: company.websiteUrl,
        openEngineeringJobs,
      });
    }

    const updatedAt =
      jobCards.reduce<Date | null>((latest, job) => {
        if (!job.postedAt) {
          return latest;
        }
        if (!latest || job.postedAt > latest) {
          return job.postedAt;
        }
        return latest;
      }, null) ??
      companies[0]?.updatedAt ??
      null;

    return {
      updatedAt,
      jobs: jobCards,
      companies: companyCards,
    };
  } catch {
    return {
      updatedAt: null,
      jobs: [],
      companies: [],
      errorMessage: REPORT_ERROR_MESSAGE,
    };
  }
};

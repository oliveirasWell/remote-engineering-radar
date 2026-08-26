import { createDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { scoreJob } from '@/lib/scoring/score-job';
import { REPORT_ERROR_MESSAGE } from './constants';
import type { ReportCompanyCard, ReportJobCard } from './types';

export type CompaniesPageItem = ReportCompanyCard & {
  jobs: ReportJobCard[];
  signalSourceUrls: string[];
};

export type CompaniesPageData = {
  companies: CompaniesPageItem[];
  errorMessage?: string;
};

export const getCompaniesPageData = async (): Promise<CompaniesPageData> => {
  try {
    const db = createDb();
    const companiesRepository = createCompaniesRepository(db);
    const hiringSignalsRepository = createHiringSignalsRepository(db);
    const jobsRepository = createJobsRepository(db);

    const companies = await companiesRepository.listByHiringScore({
      minimumHiringScore: 0,
    });

    const items: CompaniesPageItem[] = [];

    for (const company of companies) {
      const [signals, jobs] = await Promise.all([
        hiringSignalsRepository.listByCompanyId(company.id),
        jobsRepository.listByCompanyId(company.id),
      ]);

      const activeJobs = jobs.filter((job) => job.isActive);
      const jobCards = activeJobs.map((job) => {
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
          companyName: company.name,
          companyId: company.id,
          technologies: job.technologies,
          location: job.location,
          remotePolicy: job.remotePolicy,
          score: job.score,
          reasons: scored.reasons,
          postedAt: job.postedAt,
          url: job.url,
        };
      });

      items.push({
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
        openEngineeringJobs: activeJobs.length,
        jobs: jobCards,
        signalSourceUrls: signals
          .map((signal) => signal.sourceUrl)
          .filter((url): url is string => Boolean(url)),
      });
    }

    return { companies: items };
  } catch {
    return { companies: [], errorMessage: REPORT_ERROR_MESSAGE };
  }
};

import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import {
  DEFAULT_COMPANY_MARKET_FILTER,
  JOB_MAX_AGE_MS,
  type CompanyMarketFilter,
} from '@/lib/jobs/constants';
import { scoreJob } from '@/lib/scoring/score-job';
import { COMPANIES_PAGE_LIMIT, REPORT_ERROR_MESSAGE } from './constants';
import { logReportError } from './log-report-error';
import { parseCompanyMarketFilter } from './parse-company-market-filter';
import type { ReportCompanyCard, ReportJobCard } from './types';

export type CompaniesPageItem = ReportCompanyCard & {
  jobs: ReportJobCard[];
  signalSourceUrls: string[];
};

export type CompaniesPageData = {
  companies: CompaniesPageItem[];
  market: CompanyMarketFilter;
  updatedAt: Date | null;
  errorMessage?: string;
};

export type CompaniesPageOptions = {
  market?: string | string[];
};

const isRecentJob = (
  job: {
    postedAt: Date | null;
    firstSeenAt: Date;
    isActive: boolean;
  },
  now: Date,
): boolean => {
  if (!job.isActive) {
    return false;
  }
  const timestamp = job.postedAt ?? job.firstSeenAt;
  return now.getTime() - timestamp.getTime() <= JOB_MAX_AGE_MS;
};

export const getCompaniesPageData = async (
  options: CompaniesPageOptions = {},
): Promise<CompaniesPageData> => {
  const market =
    parseCompanyMarketFilter(options.market) ?? DEFAULT_COMPANY_MARKET_FILTER;

  try {
    const db = getDb();
    const companiesRepository = createCompaniesRepository(db);
    const hiringSignalsRepository = createHiringSignalsRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date();

    const companies = await companiesRepository.listByHiringScore({
      limit: COMPANIES_PAGE_LIMIT,
      minimumHiringScore: 0,
      market,
      maxJobAgeMs: JOB_MAX_AGE_MS,
      now,
    });

    const items: CompaniesPageItem[] = [];

    for (const company of companies) {
      const [signals, jobs] = await Promise.all([
        hiringSignalsRepository.listByCompanyId(company.id),
        jobsRepository.listByCompanyId(company.id),
      ]);

      const recentJobs = jobs.filter((job) => isRecentJob(job, now));
      const jobCards = recentJobs.map((job) => {
        const scored = scoreJob({
          title: job.title,
          description: job.description ?? undefined,
          location: job.location ?? undefined,
          remotePolicy: job.remotePolicy ?? undefined,
          technologies: job.technologies,
          seniority: job.seniority ?? undefined,
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
        kind: company.kind,
        summary:
          company.hiringScore >= 40
            ? 'Strong hiring signal'
            : 'Company is actively expanding engineering hiring.',
        signalDescriptions: signals.map((signal) => signal.description),
        websiteUrl: company.websiteUrl,
        openEngineeringJobs: recentJobs.length,
        jobs: jobCards,
        signalSourceUrls: [
          ...new Set(
            signals
              .map((signal) => signal.sourceUrl)
              .filter((url): url is string => Boolean(url)),
          ),
        ],
      });
    }

    const updatedAt =
      await createIngestionRunsRepository(db).getLatestCompletedAt();

    return { companies: items, market, updatedAt };
  } catch (error) {
    logReportError('companies', error);
    return {
      companies: [],
      market,
      updatedAt: null,
      errorMessage: REPORT_ERROR_MESSAGE,
    };
  }
};

import { cacheLife } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createIngestionRunsRepository } from '@/lib/db/repositories/ingestion-runs-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { JOB_MAX_AGE_MS, type JobCountrySlug } from '@/lib/jobs/constants';
import { COMPANIES_PAGE_LIMIT, REPORT_CACHE_LIFE } from './constants';
import { logReportError } from './log-report-error';
import type { ReportCompanyCard, ReportJobCard } from './types';

export type CompaniesPageItem = ReportCompanyCard & {
  jobs: ReportJobCard[];
  signalSourceUrls: string[];
};

export type CompaniesPageData = {
  companies: CompaniesPageItem[];
  country?: JobCountrySlug;
  updatedAt: Date | null;
};

export type CompaniesPageOptions = {
  country?: JobCountrySlug;
};

const groupByCompanyId = <T extends { companyId: string }>(
  rows: T[],
): Map<string, T[]> => {
  const grouped = new Map<string, T[]>();
  for (const row of rows) {
    const existing = grouped.get(row.companyId);
    if (existing) {
      existing.push(row);
    } else {
      grouped.set(row.companyId, [row]);
    }
  }
  return grouped;
};

const STRONG_HIRING_SCORE = 40;

export const getCompaniesPageData = async (
  options: CompaniesPageOptions = {},
): Promise<CompaniesPageData> => {
  'use cache';
  cacheLife(REPORT_CACHE_LIFE);

  const { country } = options;

  try {
    const db = getDb();
    const companiesRepository = createCompaniesRepository(db);
    const hiringSignalsRepository = createHiringSignalsRepository(db);
    const jobsRepository = createJobsRepository(db);
    const now = new Date();

    const companies = await companiesRepository.listByHiringScore({
      limit: COMPANIES_PAGE_LIMIT,
      minimumHiringScore: 0,
      country,
      maxJobAgeMs: JOB_MAX_AGE_MS,
      now,
    });
    const companyIds = companies.map((company) => company.id);

    // Two batched reads instead of one pair per company.
    const [signals, jobs, updatedAt] = await Promise.all([
      hiringSignalsRepository.listByCompanyIds(companyIds),
      jobsRepository.listCardsByCompanyIds(companyIds, {
        maxAgeMs: JOB_MAX_AGE_MS,
        now,
      }),
      createIngestionRunsRepository(db).getLatestCompletedAt(),
    ]);

    const signalsByCompany = groupByCompanyId(signals);
    const jobsByCompany = groupByCompanyId(jobs);

    const items = companies.map((company) => {
      const companySignals = signalsByCompany.get(company.id) ?? [];
      const companyJobs = jobsByCompany.get(company.id) ?? [];

      return {
        id: company.id,
        name: company.name,
        slug: company.slug,
        hiringScore: company.hiringScore,
        kind: company.kind,
        summary:
          company.hiringScore >= STRONG_HIRING_SCORE
            ? 'Strong hiring signal'
            : 'Company is actively expanding engineering hiring.',
        signalDescriptions: companySignals.map((signal) => signal.description),
        websiteUrl: company.websiteUrl,
        openEngineeringJobs: companyJobs.length,
        jobs: companyJobs.map((job) => ({
          id: job.id,
          title: job.title,
          companyName: company.name,
          companyId: company.id,
          technologies: job.technologies,
          location: job.location,
          remotePolicy: job.remotePolicy,
          score: job.score,
          postedAt: job.postedAt,
          url: job.url,
        })),
        signalSourceUrls: [
          ...new Set(
            companySignals
              .map((signal) => signal.sourceUrl)
              .filter((url): url is string => Boolean(url)),
          ),
        ],
      };
    });

    return { companies: items, country, updatedAt };
  } catch (error) {
    logReportError('companies', error);
    throw error;
  }
};

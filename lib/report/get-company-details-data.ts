import { cacheLife } from 'next/cache';
import { getDb } from '@/lib/db/client';
import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createHiringSignalsRepository } from '@/lib/db/repositories/hiring-signals-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import {
  JOB_MAX_AGE_MS,
  type JobCountrySlug,
  type JobFocusSlug,
} from '@/lib/jobs/constants';
import { COMPANY_JOBS_PREVIEW_LIMIT, REPORT_CACHE_LIFE } from './constants';
import { logReportError } from './log-report-error';
import type { CompanyDetails } from './types';

export const getCompanyDetailsData = async ({
  id,
  country,
  focus,
}: {
  id: string;
  country?: JobCountrySlug;
  focus?: JobFocusSlug;
}): Promise<CompanyDetails | null> => {
  'use cache';
  cacheLife(REPORT_CACHE_LIFE);

  try {
    const db = getDb();
    const company = await createCompaniesRepository(db).findById(id);
    if (!company || company.hiringScore <= 0) {
      return null;
    }

    const jobsRepository = createJobsRepository(db);
    const filters = {
      maxAgeMs: JOB_MAX_AGE_MS,
      now: new Date(),
      country,
      focus,
    };
    const counts = await jobsRepository.countByCompanyIds([id], filters);
    if (!counts.get(id)) {
      return null;
    }

    const [signals, jobs] = await Promise.all([
      createHiringSignalsRepository(db).listByCompanyId(id),
      jobsRepository.listCardsByCompanyIds([id], {
        ...filters,
        perCompanyLimit: COMPANY_JOBS_PREVIEW_LIMIT,
      }),
    ]);

    return {
      signalDescriptions: signals.map((signal) => signal.description),
      signalSourceUrls: [
        ...new Set(
          signals
            .map((signal) => signal.sourceUrl)
            .filter((url): url is string => Boolean(url)),
        ),
      ],
      jobs: jobs.map((job) => ({
        id: job.id,
        title: job.title,
        companyName: company.name,
        companyId: id,
        technologies: job.technologies,
        location: job.location,
        remotePolicy: job.remotePolicy,
        score: job.score,
        postedAt: job.postedAt,
        url: job.url,
        clickCount: job.clickCount,
      })),
    };
  } catch (error) {
    logReportError('company-details', error);
    throw error;
  }
};

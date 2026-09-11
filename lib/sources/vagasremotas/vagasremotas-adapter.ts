import {
  discardResponse,
  fetchWithRetry,
  readJsonResponse,
} from '../fetch-json';
import type { JobSource, NormalizedJob } from '../types';
import {
  VAGAS_REMOTAS_API_URL,
  VAGAS_REMOTAS_FIELDS,
  VAGAS_REMOTAS_MAX_PAGES,
  VAGAS_REMOTAS_PAGE_SIZE,
  VAGAS_REMOTAS_PROGRAMMING_CATEGORY_ID,
  VAGAS_REMOTAS_SOURCE_NAME,
  VAGAS_REMOTAS_TOTAL_PAGES_HEADER,
} from './constants';
import { normalizeVagasRemotasJob } from './normalize-vagasremotas-job';
import type { VagasRemotasAdapterOptions } from './types';

const buildJobsUrl = (page: number, pageSize: number): string => {
  const url = new URL(VAGAS_REMOTAS_API_URL);
  url.searchParams.set('page', String(page));
  url.searchParams.set('per_page', String(pageSize));
  url.searchParams.set(
    'job-categories',
    String(VAGAS_REMOTAS_PROGRAMMING_CATEGORY_ID),
  );
  url.searchParams.set('_fields', VAGAS_REMOTAS_FIELDS);
  return url.toString();
};

const fetchAllJobs = async (
  fetchImpl: typeof fetch,
  pageSize: number,
  maxPages: number,
): Promise<NormalizedJob[]> => {
  const jobs: NormalizedJob[] = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const response = await fetchWithRetry(
      buildJobsUrl(page, pageSize),
      fetchImpl,
    );
    if (!response.ok) {
      await discardResponse(response);
      throw new Error(
        `Vagas Remotas request failed (page ${page}): ${response.status}`,
      );
    }

    const totalPages = Number(
      response.headers.get(VAGAS_REMOTAS_TOTAL_PAGES_HEADER),
    );
    const records = await readJsonResponse<unknown>(response);
    if (!Array.isArray(records)) {
      throw new Error(
        `Vagas Remotas response has an unexpected shape (page ${page})`,
      );
    }

    for (const record of records) {
      const job = normalizeVagasRemotasJob(record);
      if (job) {
        jobs.push(job);
      }
    }

    if (
      records.length < pageSize ||
      (Number.isInteger(totalPages) && totalPages > 0 && page >= totalPages)
    ) {
      break;
    }
  }

  return jobs;
};

export const createVagasRemotasAdapter = (
  options: VagasRemotasAdapterOptions = {},
): JobSource => ({
  name: VAGAS_REMOTAS_SOURCE_NAME,
  // A bounded category feed is not an authoritative snapshot of the source.
  fetchJobs: async () => ({
    jobs: await fetchAllJobs(
      options.fetch ?? fetch,
      options.pageSize ?? VAGAS_REMOTAS_PAGE_SIZE,
      options.maxPages ?? VAGAS_REMOTAS_MAX_PAGES,
    ),
    complete: false,
  }),
});

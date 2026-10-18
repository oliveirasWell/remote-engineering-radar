import { useEffect, useRef, useState } from 'react';
import type { JobCountrySlug, JobFocusSlug } from '@/lib/jobs/constants';
import { COMPANY_DETAILS_API_PATH } from '@/lib/report/constants';
import type { CompaniesPageItem } from '@/lib/report/get-companies-page-data';
import type { CompanyDetails } from '@/lib/report/types';
import {
  COMPANY_DETAILS_CACHE_LIMIT,
  HOVER_PREFETCH_DELAY_MS,
} from './constants';

type DetailsResponse = Omit<CompanyDetails, 'jobs'> & {
  jobs: Array<
    Omit<CompanyDetails['jobs'][number], 'postedAt'> & {
      postedAt: string | null;
    }
  >;
};

const pendingDetails = new Map<string, Promise<CompanyDetails>>();

const fetchDetails = (key: string, url: string): Promise<CompanyDetails> => {
  const existing = pendingDetails.get(key);
  if (existing) {
    return existing;
  }

  const request = fetch(url)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error('company_details_failed');
      }
      const data = (await response.json()) as DetailsResponse;
      return {
        ...data,
        jobs: data.jobs.map((job) => ({
          ...job,
          postedAt: job.postedAt ? new Date(job.postedAt) : null,
        })),
      };
    })
    .catch((error: unknown) => {
      pendingDetails.delete(key);
      throw error;
    });

  if (pendingDetails.size >= COMPANY_DETAILS_CACHE_LIMIT) {
    pendingDetails.delete(pendingDetails.keys().next().value!);
  }
  pendingDetails.set(key, request);
  return request;
};

export const useCompanyDetails = ({
  company,
  country,
  focus,
  updatedAt,
}: {
  company: CompaniesPageItem;
  country?: JobCountrySlug;
  focus?: JobFocusSlug;
  updatedAt: Date | null;
}) => {
  const [details, setDetails] = useState<CompanyDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mounted = useRef(true);
  const opening = useRef(false);
  const failedRef = useRef(false);
  const key = JSON.stringify([
    company.id,
    country,
    focus,
    updatedAt?.toISOString(),
  ]);
  const params = new URLSearchParams();
  if (country) {
    params.set('country', country);
  }
  if (focus) {
    params.set('focus', focus);
  }
  const query = params.toString();
  const url = `${COMPANY_DETAILS_API_PATH}/${company.id}${query ? `?${query}` : ''}`;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (timer.current) {
        clearTimeout(timer.current);
      }
    };
  }, []);

  const cancelPrefetch = () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = null;
  };

  const prefetch = () => {
    if (
      company.detailsLoaded !== false ||
      pendingDetails.has(key) ||
      timer.current ||
      failedRef.current
    ) {
      return;
    }
    timer.current = setTimeout(() => {
      timer.current = null;
      void fetchDetails(key, url).catch(() => {});
    }, HOVER_PREFETCH_DELAY_MS);
  };

  const open = () => {
    if (
      company.detailsLoaded !== false ||
      details ||
      opening.current ||
      failedRef.current
    ) {
      return;
    }
    cancelPrefetch();
    opening.current = true;
    setLoading(true);
    setFailed(false);
    void fetchDetails(key, url)
      .then((result) => {
        if (mounted.current) {
          setDetails(result);
        }
      })
      .catch(() => {
        failedRef.current = true;
        if (mounted.current) {
          setFailed(true);
        }
      })
      .finally(() => {
        opening.current = false;
        if (mounted.current) {
          setLoading(false);
        }
      });
  };

  const retry = () => {
    pendingDetails.delete(key);
    failedRef.current = false;
    open();
  };

  return {
    company:
      company.detailsLoaded === false && details
        ? { ...company, ...details }
        : company,
    ready: company.detailsLoaded !== false || details !== null,
    loading,
    failed,
    prefetch,
    cancelPrefetch,
    open,
    retry,
  };
};

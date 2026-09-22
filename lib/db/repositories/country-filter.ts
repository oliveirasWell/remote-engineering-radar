import type { Prisma } from '@prisma/client';
import {
  JOB_COUNTRY_ELIGIBLE_REGIONS,
  type JobCountrySlug,
} from '@/lib/jobs/constants';

/** Jobs tagged with the country or with a region that includes it. */
export const countryFilter = (
  country: JobCountrySlug | undefined,
): Prisma.JobWhereInput =>
  country === undefined
    ? {}
    : {
        OR: [country, ...JOB_COUNTRY_ELIGIBLE_REGIONS[country]].map((slug) => ({
          countries: { array_contains: [slug] },
        })),
      };

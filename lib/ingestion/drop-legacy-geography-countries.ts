import { Prisma } from '@prisma/client';
import { classifyJob } from '@/lib/classification/classify-job';
import type { RootDb } from '@/lib/db/client';
import { resolveJobCountries } from '@/lib/jobs/countries';
import {
  LEGACY_GEOGRAPHY_COUNTRIES,
  LEGACY_GEOGRAPHY_COUNTRIES_CUTOFF,
} from './constants';
import { readStringArray } from './reclassify-active-jobs';

/**
 * What the location itself backs: countries it names, plus a region its own
 * text implies ("São Paulo" is Brazil). A location that names no country
 * ("Remote") gives nothing to check against, so a source default such as
 * Himalayas' unrestricted "Worldwide" stays.
 */
const keptCountries = (
  countries: readonly string[],
  location: string | null,
): string[] => {
  const named = resolveJobCountries({ location: location ?? undefined });
  const backed = new Set<string>([
    ...named,
    ...classifyJob({ title: '', location: location ?? undefined }).geography,
  ]);
  return named.length === 0
    ? [...countries]
    : countries.filter(
        (country) =>
          !LEGACY_GEOGRAPHY_COUNTRIES.includes(country as never) ||
          backed.has(country),
      );
};

/**
 * Removes the body-text geography the pre-#48 ingestion copied into
 * `countries`, which put jobs for Poland or the UK under the Brazil tab.
 * Returns how many rows changed.
 */
export const dropLegacyGeographyCountries = async (
  db: RootDb,
): Promise<number> => {
  // ponytail: one read of every candidate (~10k rows today); page it like
  // reclassifyActiveJobs if the table ever makes this slow.
  const rows = await db.job.findMany({
    where: {
      lastSeenAt: { lt: LEGACY_GEOGRAPHY_COUNTRIES_CUTOFF },
      OR: LEGACY_GEOGRAPHY_COUNTRIES.map((country) => ({
        countries: { array_contains: [country] },
      })),
    },
    select: { id: true, location: true, countries: true },
  });
  const updates = rows
    .map((row) => {
      const before = readStringArray(row.countries);
      return { id: row.id, before, after: keptCountries(before, row.location) };
    })
    .filter(({ before, after }) => after.length !== before.length);

  await db.$executeRaw(Prisma.sql`
    UPDATE jobs SET countries = t.countries::jsonb, updated_at = now()
    FROM unnest(
      ${updates.map(({ id }) => id)}::uuid[],
      ${updates.map(({ after }) => JSON.stringify(after))}::text[]
    ) AS t(id, countries)
    WHERE jobs.id = t.id
  `);
  return updates.length;
};

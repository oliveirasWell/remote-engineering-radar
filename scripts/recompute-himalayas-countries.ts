/**
 * One-off: rewrites `countries` on active Himalayas rows from their stored
 * location, which is exactly the joined `locationRestrictions` list. Clears
 * tags an older build derived from job descriptions. Delete after running.
 */
import { createDb, disconnectDb } from '../lib/db/client';
import { resolveJobCountries } from '../lib/jobs/countries';
import {
  HIMALAYAS_SOURCE_NAME,
  HIMALAYAS_UNRESTRICTED_COUNTRIES,
} from '../lib/sources/himalayas/constants';

const UNRESTRICTED_LOCATION = 'Remote';

const main = async () => {
  const db = createDb();
  try {
    const locations = await db.job.groupBy({
      by: ['location'],
      where: { source: HIMALAYAS_SOURCE_NAME, isActive: true },
    });

    let updated = 0;
    for (const { location } of locations) {
      const countries =
        location === UNRESTRICTED_LOCATION
          ? resolveJobCountries({
              sourceCountries: HIMALAYAS_UNRESTRICTED_COUNTRIES,
            })
          : resolveJobCountries({ location: location ?? undefined });
      const { count } = await db.job.updateMany({
        where: { source: HIMALAYAS_SOURCE_NAME, isActive: true, location },
        data: { countries },
      });
      updated += count;
    }

    console.log(`Rewrote countries on ${updated} rows`);
  } finally {
    await disconnectDb(db);
  }
};

void main();

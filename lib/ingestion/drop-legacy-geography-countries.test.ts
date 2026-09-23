import { createCompaniesRepository } from '@/lib/db/repositories/companies-repository';
import { createJobsRepository } from '@/lib/db/repositories/jobs-repository';
import { TEST_COMPANY, TEST_JOB } from '@/lib/db/repositories/test-fixtures';
import { createTestDb } from '@/lib/db/test/create-test-db';
import { LEGACY_GEOGRAPHY_COUNTRIES_CUTOFF } from './constants';
import { dropLegacyGeographyCountries } from './drop-legacy-geography-countries';

const POLAND_LOCATION = 'Poland';
const POLAND = 'poland';
const WORLDWIDE = 'worldwide';
const UNRESTRICTED_LOCATION = 'Remote';
const SAO_PAULO_LOCATION = 'São Paulo';
const SAO_PAULO = 'sao-paulo';
const BRAZIL = 'brazil';
const BEFORE_CUTOFF = new Date(
  LEGACY_GEOGRAPHY_COUNTRIES_CUTOFF.getTime() - 1000,
);
const AFTER_CUTOFF = new Date(
  LEGACY_GEOGRAPHY_COUNTRIES_CUTOFF.getTime() + 1000,
);

const seedJob = async (
  sourceJobId: string,
  job: {
    location: string;
    countries: string[];
    lastSeenAt: Date;
  },
) => {
  const db = await createTestDb();
  const company = await createCompaniesRepository(db).create(TEST_COMPANY);
  const created = await createJobsRepository(db).create({
    ...TEST_JOB,
    ...job,
    companyId: company.id,
    sourceJobId,
    technologies: [...TEST_JOB.technologies],
  });
  return { db, id: created.id };
};

const countriesOf = async (
  db: Awaited<ReturnType<typeof createTestDb>>,
  id: string,
) => (await db.job.findUniqueOrThrow({ where: { id } })).countries;

describe('dropLegacyGeographyCountries', () => {
  it('drops a body-derived region the stored location does not name', async () => {
    const { db, id } = await seedJob('stale', {
      location: POLAND_LOCATION,
      countries: [POLAND, WORLDWIDE],
      lastSeenAt: BEFORE_CUTOFF,
    });

    await expect(dropLegacyGeographyCountries(db)).resolves.toBe(1);
    await expect(countriesOf(db, id)).resolves.toEqual([POLAND]);
  });

  it('keeps a region when the location names no country at all', async () => {
    const { db, id } = await seedJob('unrestricted', {
      location: UNRESTRICTED_LOCATION,
      countries: [WORLDWIDE],
      lastSeenAt: BEFORE_CUTOFF,
    });

    await expect(dropLegacyGeographyCountries(db)).resolves.toBe(0);
    await expect(countriesOf(db, id)).resolves.toEqual([WORLDWIDE]);
  });

  it('leaves rows the fixed ingestion already rewrote', async () => {
    const { db, id } = await seedJob('fresh', {
      location: POLAND_LOCATION,
      countries: [POLAND, WORLDWIDE],
      lastSeenAt: AFTER_CUTOFF,
    });

    await expect(dropLegacyGeographyCountries(db)).resolves.toBe(0);
    await expect(countriesOf(db, id)).resolves.toEqual([POLAND, WORLDWIDE]);
  });

  it('keeps a region the location implies without naming it as a country', async () => {
    const { db, id } = await seedJob('city', {
      location: SAO_PAULO_LOCATION,
      countries: [SAO_PAULO, BRAZIL],
      lastSeenAt: BEFORE_CUTOFF,
    });

    await expect(dropLegacyGeographyCountries(db)).resolves.toBe(0);
    await expect(countriesOf(db, id)).resolves.toEqual([SAO_PAULO, BRAZIL]);
  });
});

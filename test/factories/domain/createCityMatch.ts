import type { CityMatch } from '@/lib/weather/types';
import { CHICAGO } from '@/test/fixtures/chicago';

export const createCityMatch = (
  overrides: Partial<CityMatch> = {},
): CityMatch => ({
  id: `${CHICAGO.lat},${CHICAGO.lon}`,
  ...CHICAGO,
  ...overrides,
});

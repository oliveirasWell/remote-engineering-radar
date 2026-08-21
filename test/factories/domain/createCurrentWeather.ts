import type { CurrentWeather } from '@/lib/weather/types';
import { CHICAGO } from '@/test/fixtures/chicago';

export const createCurrentWeather = (
  overrides: Partial<CurrentWeather> = {},
): CurrentWeather => ({
  city: CHICAGO.name,
  temp: 20,
  condition: 'broken clouds',
  iconCode: 803,
  isDay: false,
  ...overrides,
});

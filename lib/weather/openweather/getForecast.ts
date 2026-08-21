import 'server-only';

import { aggregate } from '../aggregate';
import {
  forecastResponseSchema,
  type ForecastResponse,
} from '../schemas/forecastResponse';
import type { ForecastDay } from '../types';
import { OPENWEATHER_ENDPOINTS, WEATHER_UNITS } from './constants';
import { fetchOpenWeatherJson } from './fetchOpenWeatherJson';

export const getForecast = async (
  lat: number,
  lon: number,
  fetchFn: typeof fetch = fetch,
): Promise<ForecastDay[]> => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: WEATHER_UNITS,
    appid: process.env.OPENWEATHER_API_KEY ?? '',
  });
  const payload: ForecastResponse = forecastResponseSchema.parse(
    await fetchOpenWeatherJson(
      `${OPENWEATHER_ENDPOINTS.forecast}?${params.toString()}`,
      fetchFn,
    ),
  );
  return aggregate(payload.list, payload.city.timezone);
};

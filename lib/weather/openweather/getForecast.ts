import 'server-only';

import { aggregate } from '../aggregate';
import {
  forecastResponseSchema,
  type ForecastResponse,
} from '../schemas/forecastResponse';
import type { ForecastDay } from '../types';
import type { WeatherProvider } from '../provider';
import {
  OPENWEATHER_ENDPOINTS,
  WEATHER_REVALIDATE_SECONDS,
  WEATHER_UNITS,
} from './constants';
import { fetchOpenWeatherJson } from './fetchOpenWeatherJson';

export const getForecast: WeatherProvider['getForecast'] = async (
  lat,
  lon,
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
      WEATHER_REVALIDATE_SECONDS,
    ),
  );
  return aggregate(payload.list, payload.city.timezone);
};

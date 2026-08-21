import 'server-only';

import { aggregate } from '../aggregate';
import {
  forecastResponseSchema,
  type ForecastResponse,
} from '../schemas/forecastResponse';
import type { ForecastDay } from '../types';
import type { WeatherProvider } from '../provider';
import { WeatherProviderError } from './WeatherProviderError';

const FORECAST_ENDPOINT = 'https://api.openweathermap.org/data/2.5/forecast';
const WEATHER_REVALIDATE_SECONDS = 600;
const WEATHER_UNITS = 'metric';

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
  const response = await fetch(`${FORECAST_ENDPOINT}?${params.toString()}`, {
    next: { revalidate: WEATHER_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new WeatherProviderError(response.status);
  }

  const payload: ForecastResponse = forecastResponseSchema.parse(
    await response.json(),
  );
  return aggregate(payload.list, payload.city.timezone);
};

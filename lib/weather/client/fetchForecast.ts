import type { ForecastDay } from '@/lib/weather/types';
import { WEATHER_API_ERRORS } from '../constants';
import { buildForecastUrl } from './buildForecastUrl';

export const fetchForecast = async (
  lat: number,
  lon: number,
): Promise<ForecastDay[]> => {
  const response = await fetch(buildForecastUrl(lat, lon));
  if (!response.ok) {
    throw new Error(WEATHER_API_ERRORS.weather);
  }
  return (await response.json()) as ForecastDay[];
};

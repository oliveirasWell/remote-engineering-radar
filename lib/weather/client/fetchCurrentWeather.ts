import type { CurrentWeather } from '@/lib/weather/types';
import { buildCurrentWeatherUrl } from './buildCurrentWeatherUrl';
import { WEATHER_API_ERRORS } from '../constants';

export const fetchCurrentWeather = async (
  lat: number,
  lon: number,
): Promise<CurrentWeather> => {
  const response = await fetch(buildCurrentWeatherUrl(lat, lon));
  if (!response.ok) {
    throw new Error(WEATHER_API_ERRORS.weather);
  }
  return (await response.json()) as CurrentWeather;
};

import 'server-only';

import type { CurrentWeather } from '../types';
import {
  currentWeatherResponseSchema,
  type CurrentWeatherResponse,
} from '../schemas/currentWeatherResponse';
import { roundTemperature } from '../roundTemperature/roundTemperature';
import { OPENWEATHER_ENDPOINTS, WEATHER_UNITS } from './constants';
import { fetchOpenWeatherJson } from './fetchOpenWeatherJson';

export const getCurrentWeather = async (
  lat: number,
  lon: number,
  fetchFn: typeof fetch = fetch,
): Promise<CurrentWeather> => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: WEATHER_UNITS,
    appid: process.env.OPENWEATHER_API_KEY ?? '',
  });
  const payload: CurrentWeatherResponse = currentWeatherResponseSchema.parse(
    await fetchOpenWeatherJson(
      `${OPENWEATHER_ENDPOINTS.currentWeather}?${params.toString()}`,
      fetchFn,
    ),
  );
  const [primaryCondition] = payload.weather;

  return {
    city: payload.name,
    temp: roundTemperature(payload.main.temp),
    condition: primaryCondition.description,
    iconCode: primaryCondition.id,
    isDay: primaryCondition.icon.endsWith('d'),
  };
};

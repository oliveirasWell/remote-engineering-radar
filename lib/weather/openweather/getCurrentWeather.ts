import 'server-only';

import type { CurrentWeather } from '../types';
import type { WeatherProvider } from '../provider';
import {
  currentWeatherResponseSchema,
  type CurrentWeatherResponse,
} from '../schemas/currentWeatherResponse';
import { roundTemperature } from '../roundTemperature/roundTemperature';
import { WeatherProviderError } from './WeatherProviderError';

const CURRENT_WEATHER_ENDPOINT =
  'https://api.openweathermap.org/data/2.5/weather';
const WEATHER_REVALIDATE_SECONDS = 600;
const WEATHER_UNITS = 'metric';

export const getCurrentWeather: WeatherProvider['getCurrentWeather'] = async (
  lat,
  lon,
): Promise<CurrentWeather> => {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    units: WEATHER_UNITS,
    appid: process.env.OPENWEATHER_API_KEY ?? '',
  });
  const response = await fetch(
    `${CURRENT_WEATHER_ENDPOINT}?${params.toString()}`,
    { next: { revalidate: WEATHER_REVALIDATE_SECONDS } },
  );

  if (!response.ok) {
    throw new WeatherProviderError(response.status);
  }

  const payload: CurrentWeatherResponse = currentWeatherResponseSchema.parse(
    await response.json(),
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

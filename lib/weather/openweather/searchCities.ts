import 'server-only';

import type { CityMatch } from '../types';
import type { WeatherProvider } from '../provider';
import {
  geocodeResponseSchema,
  type GeocodeResponse,
} from '../schemas/geocodeResponse';
import {
  GEOCODE_LIMIT,
  GEOCODE_REVALIDATE_SECONDS,
  OPENWEATHER_ENDPOINTS,
} from './constants';
import { fetchOpenWeatherJson } from './fetchOpenWeatherJson';

const EMPTY_QUERY_STATUSES = [400, 404] as const;

export const searchCities: WeatherProvider['searchCities'] = async (
  query,
): Promise<CityMatch[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: String(GEOCODE_LIMIT),
    appid: process.env.OPENWEATHER_API_KEY ?? '',
  });
  const payload = await fetchOpenWeatherJson(
    `${OPENWEATHER_ENDPOINTS.geocode}?${params.toString()}`,
    GEOCODE_REVALIDATE_SECONDS,
    EMPTY_QUERY_STATUSES,
  );

  if (payload === null) {
    return [];
  }

  const geocodePayload: GeocodeResponse = geocodeResponseSchema.parse(payload);
  return geocodePayload.map((city) => ({
    id: `${city.lat},${city.lon}`,
    name: city.name,
    state: city.state,
    country: city.country,
    lat: city.lat,
    lon: city.lon,
  }));
};

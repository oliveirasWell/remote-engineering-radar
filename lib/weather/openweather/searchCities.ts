import 'server-only';

import type { CityMatch } from '../types';
import {
  geocodeResponseSchema,
  type GeocodeResponse,
} from '../schemas/geocodeResponse';
import { GEOCODE_LIMIT, OPENWEATHER_ENDPOINTS } from './constants';
import { fetchOpenWeatherJson } from './fetchOpenWeatherJson';

const EMPTY_QUERY_STATUSES = [400, 404] as const;

export const searchCities = async (
  query: string,
  fetchFn: typeof fetch = fetch,
): Promise<CityMatch[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: String(GEOCODE_LIMIT),
    appid: process.env.OPENWEATHER_API_KEY ?? '',
  });
  const payload = await fetchOpenWeatherJson(
    `${OPENWEATHER_ENDPOINTS.geocode}?${params.toString()}`,
    fetchFn,
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

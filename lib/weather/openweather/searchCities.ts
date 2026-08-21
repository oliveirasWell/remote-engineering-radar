import 'server-only';

import type { CityMatch } from '../types';
import type { WeatherProvider } from '../provider';
import {
  geocodeResponseSchema,
  type GeocodeResponse,
} from '../schemas/geocodeResponse';
import { WeatherProviderError } from './WeatherProviderError';

const GEOCODE_ENDPOINT = 'https://api.openweathermap.org/geo/1.0/direct';
const GEOCODE_LIMIT = 5;
const GEOCODE_REVALIDATE_SECONDS = 2_592_000;

export const searchCities: WeatherProvider['searchCities'] = async (
  query,
): Promise<CityMatch[]> => {
  const params = new URLSearchParams({
    q: query,
    limit: String(GEOCODE_LIMIT),
    appid: process.env.OPENWEATHER_API_KEY ?? '',
  });
  const response = await fetch(`${GEOCODE_ENDPOINT}?${params.toString()}`, {
    next: { revalidate: GEOCODE_REVALIDATE_SECONDS },
  });

  if (response.status === 400 || response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new WeatherProviderError(response.status);
  }

  const geocodePayload: GeocodeResponse = geocodeResponseSchema.parse(
    await response.json(),
  );
  return geocodePayload.map((city) => ({
    id: `${city.lat},${city.lon}`,
    name: city.name,
    state: city.state,
    country: city.country,
    lat: city.lat,
    lon: city.lon,
  }));
};

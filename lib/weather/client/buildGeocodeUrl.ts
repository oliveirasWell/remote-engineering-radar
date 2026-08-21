import { WEATHER_API_PATHS } from '../constants';

export const buildGeocodeUrl = (query: string) => {
  const params = new URLSearchParams({ q: query });
  return `${WEATHER_API_PATHS.geocode}?${params.toString()}`;
};

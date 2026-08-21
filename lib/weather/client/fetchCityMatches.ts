import type { CityMatch } from '@/lib/weather/types';
import { buildGeocodeUrl } from './buildGeocodeUrl';
import { WEATHER_API_ERRORS } from '../constants';

export const fetchCityMatches = async (query: string): Promise<CityMatch[]> => {
  const response = await fetch(buildGeocodeUrl(query));
  if (!response.ok) {
    throw new Error(WEATHER_API_ERRORS.search);
  }
  return (await response.json()) as CityMatch[];
};

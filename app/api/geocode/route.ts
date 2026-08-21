import { weatherProvider } from '../weatherProvider';
import { jsonProviderResponse } from '../jsonProviderResponse';
import { normalizeSearchQuery } from '@/lib/searchQuery';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';

export const GET = async (request: Request) => {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  const normalizedQuery = normalizeSearchQuery(query);

  return jsonProviderResponse(
    () => weatherProvider.searchCities(normalizedQuery),
    WEATHER_API_ERRORS.search,
  );
};

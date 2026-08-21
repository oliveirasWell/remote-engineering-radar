import { searchCities } from '@/lib/weather/openweather';
import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';
import { normalizeSearchQuery } from '@/lib/searchQuery';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';

export const GET = async (request: Request) => {
  const query = new URL(request.url).searchParams.get('q') ?? '';
  const normalizedQuery = normalizeSearchQuery(query);

  try {
    return Response.json(await searchCities(normalizedQuery));
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      return Response.json({ error: WEATHER_API_ERRORS.search }, { status: 502 });
    }
    throw error;
  }
};

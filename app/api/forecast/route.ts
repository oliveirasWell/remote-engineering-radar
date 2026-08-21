import { getForecast } from '@/lib/weather/openweather';
import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { parseCoordinates } from '../parseCoordinates';

export const GET = async (request: Request) => {
  const coordinates = parseCoordinates(new URL(request.url).searchParams);

  if (!coordinates) {
    return Response.json({ error: 'Invalid forecast request' }, { status: 400 });
  }

  try {
    return Response.json(
      await getForecast(coordinates.lat, coordinates.lon),
    );
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      return Response.json({ error: WEATHER_API_ERRORS.weather }, { status: 502 });
    }
    throw error;
  }
};

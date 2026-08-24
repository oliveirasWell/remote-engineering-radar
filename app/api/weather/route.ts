import { getCurrentWeather } from '@/lib/weather/openweather';
import { jsonProviderResponse } from '../jsonProviderResponse';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { parseCoordinates } from '../parseCoordinates';

export const GET = async (request: Request) => {
  const coordinates = parseCoordinates(new URL(request.url).searchParams);

  if (!coordinates) {
    return Response.json({ error: 'Invalid weather request' }, { status: 400 });
  }

  return jsonProviderResponse(
    () => getCurrentWeather(coordinates.lat, coordinates.lon),
    WEATHER_API_ERRORS.weather,
  );
};

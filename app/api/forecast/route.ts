import { weatherProvider } from '../weatherProvider';
import { jsonProviderResponse } from '../jsonProviderResponse';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { parseCoordinates } from '../parseCoordinates';

export const GET = async (request: Request) => {
  const coordinates = parseCoordinates(new URL(request.url).searchParams);

  if (!coordinates) {
    return Response.json({ error: 'Invalid forecast request' }, { status: 400 });
  }

  return jsonProviderResponse(
    () => weatherProvider.getForecast(coordinates.lat, coordinates.lon),
    WEATHER_API_ERRORS.weather,
  );
};

import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';

export const jsonProviderResponse = async <T>(
  run: () => Promise<T>,
  errorMessage: string,
) => {
  try {
    return Response.json(await run());
  } catch (error) {
    if (error instanceof WeatherProviderError) {
      return Response.json({ error: errorMessage }, { status: 502 });
    }
    throw error;
  }
};

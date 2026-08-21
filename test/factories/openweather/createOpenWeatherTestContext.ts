import { jsonResponse, TEST_API_KEY } from '@/test/http';
import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';

export const createOpenWeatherTestContext = () => {
  const fetchMock = vi.fn();

  return {
    fetchMock,
    setup: () => {
      fetchMock.mockReset();
      vi.stubGlobal('fetch', fetchMock);
      process.env.OPENWEATHER_API_KEY = TEST_API_KEY;
    },
    cleanup: () => {
      vi.unstubAllGlobals();
    },
    mockJsonResponse: (body: unknown, status = 200) => {
      fetchMock.mockResolvedValue(jsonResponse(body, status));
    },
    expectProviderError: async (
      request: () => Promise<unknown>,
      status: number,
    ) => {
      const error = await request().catch((reason: unknown) => reason);
      expect(error).toBeInstanceOf(WeatherProviderError);
      expect(error).toMatchObject({ status });
    },
  };
};

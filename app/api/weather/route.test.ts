import { createCurrentWeather } from '@/test/factories/domain';
import { CHICAGO } from '@/test/fixtures/chicago';
import { routeRequest } from '@/test/http';
import { WEATHER_API_ERRORS, WEATHER_API_PATHS } from '@/lib/weather/constants';
import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';
import { GET } from './route';

const { getCurrentWeatherMock } = vi.hoisted(() => ({
  getCurrentWeatherMock: vi.fn(),
}));

vi.mock('@/app/api/weatherProvider', () => ({
  weatherProvider: {
    getCurrentWeather: getCurrentWeatherMock,
  },
}));

const current = createCurrentWeather();
const UPSTREAM_FAILURE_MESSAGE = 'upstream secret details appid';
const PROVIDER_ERROR_STATUS = 401;
const INVALID_WEATHER_QUERIES = [
  '?lon=0',
  '?lat=0',
  '?lat=&lon=0',
  '?lat=abc&lon=0',
  '?lat=0&lon=abc',
  '?lat=91&lon=0',
  '?lat=-91&lon=0',
  '?lat=0&lon=181',
  '?lat=0&lon=-181',
] as const;

const weatherQuery = (lat: number, lon: number) =>
  `?${new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  }).toString()}`;

const request = (query: string) =>
  GET(routeRequest(WEATHER_API_PATHS.weather, query));

describe('GET /api/weather', () => {
  beforeEach(() => {
    getCurrentWeatherMock.mockReset();
  });

  it.each(INVALID_WEATHER_QUERIES)(
    'returns 400 for an invalid weather request: %s',
    async (query) => {
      const response = await request(query);

      expect(response.status).toBe(400);
      expect(getCurrentWeatherMock).not.toHaveBeenCalled();
    },
  );

  it('returns current weather for valid coordinates', async () => {
    getCurrentWeatherMock.mockResolvedValue(current);

    const response = await request(weatherQuery(CHICAGO.lat, CHICAGO.lon));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(current);
    expect(getCurrentWeatherMock).toHaveBeenCalledWith(
      CHICAGO.lat,
      CHICAGO.lon,
    );
  });

  it('maps provider failures to the API error contract', async () => {
    getCurrentWeatherMock.mockRejectedValue(
      new WeatherProviderError(PROVIDER_ERROR_STATUS),
    );

    const response = await request(weatherQuery(41, -87));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: WEATHER_API_ERRORS.weather,
    });
  });

  it('does not hide unexpected application errors as upstream failures', async () => {
    getCurrentWeatherMock.mockRejectedValue(
      new Error(UPSTREAM_FAILURE_MESSAGE),
    );

    await expect(request(weatherQuery(41, -87))).rejects.toThrow(
      UPSTREAM_FAILURE_MESSAGE,
    );
  });
});

import { createForecastDays } from '@/test/factories/domain';
import { routeRequest } from '@/test/http';
import { WEATHER_API_ERRORS, WEATHER_API_PATHS } from '@/lib/weather/constants';
import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';
import { GET } from './route';

const { getForecastMock } = vi.hoisted(() => ({
  getForecastMock: vi.fn(),
}));

vi.mock('@/app/api/weatherProviderService', () => ({
  weatherProviderService: {
    getForecast: getForecastMock,
  },
}));

const forecast = createForecastDays();
const request = (query: string) =>
  GET(routeRequest(WEATHER_API_PATHS.forecast, query));

describe('GET /api/forecast', () => {
  beforeEach(() => {
    getForecastMock.mockReset();
  });

  it('returns forecast days for valid coordinates', async () => {
    getForecastMock.mockResolvedValue(forecast);

    const response = await request('?lat=41.8755616&lon=-87.6244212');

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(forecast);
    expect(getForecastMock).toHaveBeenCalledWith(41.8755616, -87.6244212);
  });

  it('rejects invalid coordinates', async () => {
    const response = await request('?lat=91&lon=0');

    expect(response.status).toBe(400);
    expect(getForecastMock).not.toHaveBeenCalled();
  });

  it('maps provider failures to the API error contract', async () => {
    getForecastMock.mockRejectedValue(new WeatherProviderError(401));

    const response = await request('?lat=41&lon=-87');

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: WEATHER_API_ERRORS.weather,
    });
  });
});

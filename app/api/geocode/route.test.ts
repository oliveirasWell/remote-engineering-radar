import { createCityMatch } from '@/test/factories/domain';
import { routeRequest } from '@/test/http';
import { WEATHER_API_ERRORS, WEATHER_API_PATHS } from '@/lib/weather/constants';
import { WeatherProviderError } from '@/lib/weather/openweather/WeatherProviderError';
import { GET } from './route';

const { searchCitiesMock } = vi.hoisted(() => ({
  searchCitiesMock: vi.fn(),
}));

vi.mock('@/lib/weather/openweather', () => ({
  searchCities: searchCitiesMock,
}));

const city = createCityMatch();
const EMPTY_QUERY = '';
const NORMALIZATION_INPUT = '?q=%20%20Chi%20%20cago%20%20';
const NORMALIZED_QUERY = 'chi cago';
const CITY_QUERY = `?q=${city.name.toLowerCase()}`;

const request = (query: string) =>
  GET(routeRequest(WEATHER_API_PATHS.geocode, query));

describe('GET /api/geocode', () => {
  beforeEach(() => {
    searchCitiesMock.mockReset();
  });

  it('delegates query eligibility to the client', async () => {
    searchCitiesMock.mockResolvedValue([]);

    const response = await request(EMPTY_QUERY);

    expect(response.status).toBe(200);
    expect(searchCitiesMock).toHaveBeenCalledWith(EMPTY_QUERY);
  });

  it('normalizes the query before calling the provider', async () => {
    searchCitiesMock.mockResolvedValue([city]);

    const response = await request(NORMALIZATION_INPUT);

    expect(response.status).toBe(200);
    expect(searchCitiesMock).toHaveBeenCalledWith(NORMALIZED_QUERY);
  });

  it('returns the provider city matches as JSON', async () => {
    searchCitiesMock.mockResolvedValue([city]);

    const response = await request(CITY_QUERY);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual([city]);
  });

  it('maps provider failures to the API error contract', async () => {
    searchCitiesMock.mockRejectedValue(new WeatherProviderError(401));

    const response = await request(CITY_QUERY);

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: WEATHER_API_ERRORS.search,
    });
  });
});

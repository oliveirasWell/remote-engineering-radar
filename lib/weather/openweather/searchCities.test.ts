import chicago from '../fixtures/geocode-chicago.json';
import empty from '../fixtures/geocode-empty.json';
import { createOpenWeatherTestContext } from '@/test/factories/openweather/createOpenWeatherTestContext';
import { NAIROBI } from '@/test/fixtures/nairobi';
import { TEST_API_KEY } from '@/test/http';
import { searchCities } from './searchCities';

const context = createOpenWeatherTestContext();
const [
  usChicago,
  southAfricaChicago,
  zimbabweChicago,
  guatemalaChicago,
  kenyaChicago,
] = chicago;
const CITY_QUERY = usChicago.name.toLowerCase();
const US_CHICAGO_ID = `${usChicago.lat},${usChicago.lon}`;
const NO_MATCH_QUERY = 'asdfgh';
const UNKNOWN_CITY_QUERY = 'unknown-city';
const GEOCODE_ENDPOINT_PATH = '/geo/1.0/direct';
const GEOCODE_LIMIT_PARAM = 'limit=5';
const CITY_QUERY_PARAM = `q=${CITY_QUERY}`;
const API_KEY_PARAM = `appid=${TEST_API_KEY}`;

describe('OpenWeather city search', () => {
  beforeEach(context.setup);
  afterEach(context.cleanup);

  it('maps the Chicago fixture to domain city matches', async () => {
    context.mockJsonResponse(chicago);

    await expect(searchCities(CITY_QUERY)).resolves.toEqual([
      expect.objectContaining({
        id: US_CHICAGO_ID,
        name: usChicago.name,
        state: usChicago.state,
        country: usChicago.country,
        lat: usChicago.lat,
        lon: usChicago.lon,
      }),
      expect.objectContaining({
        name: southAfricaChicago.name,
        state: southAfricaChicago.state,
      }),
      expect.objectContaining({ name: zimbabweChicago.name }),
      expect.objectContaining({ name: guatemalaChicago.name }),
      expect.objectContaining({ name: kenyaChicago.name }),
    ]);
  });

  it('returns an empty list for an empty upstream response', async () => {
    context.mockJsonResponse(empty);

    await expect(searchCities(NO_MATCH_QUERY)).resolves.toEqual([]);
  });

  it('maps an omitted upstream state to undefined', async () => {
    context.mockJsonResponse([NAIROBI]);

    await expect(searchCities(NAIROBI.name.toLowerCase())).resolves.toEqual([
      expect.objectContaining({ state: undefined }),
    ]);
  });

  it('throws a typed error for a non-ok response', async () => {
    context.mockJsonResponse({}, 401);

    await context.expectProviderError(() => searchCities(CITY_QUERY), 401);
  });

  it.each([400, 404])(
    'treats an invalid or unmatched query response (%s) as no results',
    async (status) => {
      context.mockJsonResponse({}, status);

      await expect(searchCities(UNKNOWN_CITY_QUERY)).resolves.toEqual([]);
    },
  );

  it('sends the query, key and limit', async () => {
    context.mockJsonResponse([]);

    await searchCities(CITY_QUERY);

    expect(context.fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(GEOCODE_ENDPOINT_PATH),
    );
    const [url] = context.fetchMock.mock.calls[0] as [string];
    expect(url).toContain(GEOCODE_ENDPOINT_PATH);
    expect(url).toContain(CITY_QUERY_PARAM);
    expect(url).toContain(GEOCODE_LIMIT_PARAM);
    expect(url).toContain(API_KEY_PARAM);
  });
});

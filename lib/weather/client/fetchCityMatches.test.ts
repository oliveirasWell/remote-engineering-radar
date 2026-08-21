import { createCityMatch } from '@/test/factories/domain';
import { jsonResponse } from '@/test/http';
import { buildGeocodeUrl } from './buildGeocodeUrl';
import { WEATHER_API_ERRORS } from '../constants';
import { fetchCityMatches } from './fetchCityMatches';

const fetchMock = vi.fn();
const CITY_QUERY = createCityMatch().name.toLowerCase();
const MULTI_WORD_QUERY = 'new york';

describe('fetchCityMatches', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and returns city matches', async () => {
    const cities = [createCityMatch()];
    fetchMock.mockResolvedValue(jsonResponse(cities));

    await expect(fetchCityMatches(MULTI_WORD_QUERY)).resolves.toEqual(cities);
    expect(fetchMock).toHaveBeenCalledWith(buildGeocodeUrl(MULTI_WORD_QUERY));
  });

  it('rejects a non-ok response with the public error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 502));

    await expect(fetchCityMatches(CITY_QUERY)).rejects.toThrow(
      WEATHER_API_ERRORS.search,
    );
  });
});

import { createCurrentWeather } from '@/test/factories/domain';
import { CHICAGO } from '@/test/fixtures/chicago';
import { jsonResponse } from '@/test/http';
import { buildCurrentWeatherUrl } from './buildCurrentWeatherUrl';
import { WEATHER_API_ERRORS } from '../constants';
import { fetchCurrentWeather } from './fetchCurrentWeather';

const fetchMock = vi.fn();
const FAILURE_COORDINATES = { lat: 41, lon: -87 } as const;

describe('fetchCurrentWeather', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and returns current weather', async () => {
    const weather = createCurrentWeather();
    fetchMock.mockResolvedValue(jsonResponse(weather));

    await expect(
      fetchCurrentWeather(CHICAGO.lat, CHICAGO.lon),
    ).resolves.toEqual(weather);
    expect(fetchMock).toHaveBeenCalledWith(
      buildCurrentWeatherUrl(CHICAGO.lat, CHICAGO.lon),
    );
  });

  it('rejects a non-ok response with the public error', async () => {
    fetchMock.mockResolvedValue(jsonResponse({}, 502));

    await expect(
      fetchCurrentWeather(FAILURE_COORDINATES.lat, FAILURE_COORDINATES.lon),
    ).rejects.toThrow(WEATHER_API_ERRORS.weather);
  });
});

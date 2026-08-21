import current from '../fixtures/current-chicago.json';
import { CHICAGO } from '@/test/fixtures/chicago';
import { TEST_API_KEY } from '@/test/http';
import { roundTemperature } from '../roundTemperature/roundTemperature';
import { getCurrentWeather } from './getCurrentWeather';
import { createOpenWeatherTestContext } from '@/test/factories/openweather/createOpenWeatherTestContext';

const context = createOpenWeatherTestContext();
const [primaryCondition] = current.weather;
const CURRENT_WEATHER_ENDPOINT_PATH = '/data/2.5/weather';
const LATITUDE_PARAM = `lat=${CHICAGO.lat}`;
const LONGITUDE_PARAM = `lon=${CHICAGO.lon}`;
const API_KEY_PARAM = `appid=${TEST_API_KEY}`;
const METRIC_UNITS_PARAM = 'units=metric';
const WEATHER_REVALIDATE_SECONDS = 600;

describe('OpenWeather current weather', () => {
  beforeEach(context.setup);
  afterEach(context.cleanup);

  it('maps weather and derives day/night from the icon suffix', async () => {
    context.mockJsonResponse(current);

    await expect(
      getCurrentWeather(CHICAGO.lat, CHICAGO.lon),
    ).resolves.toEqual({
      city: current.name,
      temp: roundTemperature(current.main.temp),
      condition: primaryCondition.description,
      iconCode: primaryCondition.id,
      isDay: false,
    });
  });

  it('requests the canonical metric units', async () => {
    context.mockJsonResponse(current);

    await getCurrentWeather(CHICAGO.lat, CHICAGO.lon);

    expect(context.fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        next: { revalidate: WEATHER_REVALIDATE_SECONDS },
      }),
    );
    const [url] = context.fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain(CURRENT_WEATHER_ENDPOINT_PATH);
    expect(url).toContain(LATITUDE_PARAM);
    expect(url).toContain(LONGITUDE_PARAM);
    expect(url).toContain(METRIC_UNITS_PARAM);
    expect(url).toContain(API_KEY_PARAM);
  });

  it('uses the shared typed error for upstream failures', async () => {
    context.mockJsonResponse({}, 401);

    await context.expectProviderError(
      () => getCurrentWeather(CHICAGO.lat, CHICAGO.lon),
      401,
    );
  });
});

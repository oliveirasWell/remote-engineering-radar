import forecast from '../fixtures/forecast-chicago.json';
import { CHICAGO } from '@/test/fixtures/chicago';
import { createOpenWeatherTestContext } from '@/test/factories/openweather/createOpenWeatherTestContext';
import { getForecast } from './getForecast';

const context = createOpenWeatherTestContext();

describe('OpenWeather forecast', () => {
  beforeEach(context.setup);
  afterEach(context.cleanup);

  it('validates, aggregates and returns forecast days', async () => {
    context.mockJsonResponse(forecast);

    const result = await getForecast(CHICAGO.lat, CHICAGO.lon);

    expect(result).toHaveLength(5);
    expect(context.fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/data/2.5/forecast'),
    );
    const [url] = context.fetchMock.mock.calls[0] as [string];
    expect(url).toContain('units=metric');
  });

  it('uses metric units and rejects upstream failures', async () => {
    context.mockJsonResponse({}, 401);

    await context.expectProviderError(
      () => getForecast(CHICAGO.lat, CHICAGO.lon),
      401,
    );
  });
});

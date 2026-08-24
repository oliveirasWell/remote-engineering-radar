import current from '@/lib/weather/fixtures/current-chicago.json';
import { CHICAGO } from '@/test/fixtures/chicago';
import { createOpenWeatherTestContext } from '@/test/factories/openweather/createOpenWeatherTestContext';
import {
  GEOCODE_REVALIDATE_SECONDS,
  WEATHER_REVALIDATE_SECONDS,
} from './constants';
import { weatherProviderService } from './weatherProviderService';

const context = createOpenWeatherTestContext();
const CITY_QUERY = 'chicago';

describe('weatherProviderService cache', () => {
  beforeEach(context.setup);
  afterEach(context.cleanup);

  it('revalidates geocoding for thirty days', async () => {
    context.mockJsonResponse([]);

    await weatherProviderService.searchCities(CITY_QUERY);

    expect(context.fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        next: { revalidate: GEOCODE_REVALIDATE_SECONDS },
      }),
    );
  });

  it('revalidates weather for ten minutes', async () => {
    context.mockJsonResponse(current);

    await weatherProviderService.getCurrentWeather(CHICAGO.lat, CHICAGO.lon);

    expect(context.fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        next: { revalidate: WEATHER_REVALIDATE_SECONDS },
      }),
    );
  });
});

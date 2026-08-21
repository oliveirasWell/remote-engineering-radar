import { buildCurrentWeatherUrl } from './buildCurrentWeatherUrl';
import { buildGeocodeUrl } from './buildGeocodeUrl';
import { CHICAGO } from '@/test/fixtures/chicago';

const GEOCODE_QUERY = 'new york';
const EXPECTED_GEOCODE_URL = '/api/geocode?q=new+york';
const EXPECTED_CURRENT_WEATHER_URL =
  '/api/weather?lat=41.8755616&lon=-87.6244212';

describe('weather API client contract', () => {
  it('builds an encoded geocode URL', () => {
    expect(buildGeocodeUrl(GEOCODE_QUERY)).toBe(EXPECTED_GEOCODE_URL);
  });

  it('builds a current-weather URL from coordinates', () => {
    expect(buildCurrentWeatherUrl(CHICAGO.lat, CHICAGO.lon)).toBe(
      EXPECTED_CURRENT_WEATHER_URL,
    );
  });
});

import { createOpenWeatherProviderService } from '@/lib/weather/openweather';
import {
  GEOCODE_REVALIDATE_SECONDS,
  WEATHER_REVALIDATE_SECONDS,
} from './constants';

const fetchWithRevalidate =
  (revalidateSeconds: number): typeof fetch =>
  (input, init) =>
    fetch(input, { ...init, next: { revalidate: revalidateSeconds } });

export const weatherProviderService = createOpenWeatherProviderService({
  fetchGeocode: fetchWithRevalidate(GEOCODE_REVALIDATE_SECONDS),
  fetchWeather: fetchWithRevalidate(WEATHER_REVALIDATE_SECONDS),
});

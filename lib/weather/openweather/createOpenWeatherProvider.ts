import 'server-only';

import type { WeatherProvider } from '../provider';
import { getCurrentWeather } from './getCurrentWeather';
import { getForecast } from './getForecast';
import { searchCities } from './searchCities';

type OpenWeatherDependencies = {
  fetchGeocode?: typeof fetch;
  fetchWeather?: typeof fetch;
};

export const createOpenWeatherProvider = ({
  fetchGeocode = fetch,
  fetchWeather = fetch,
}: OpenWeatherDependencies = {}): WeatherProvider => ({
  searchCities: (query) => searchCities(query, fetchGeocode),
  getCurrentWeather: (lat, lon) => getCurrentWeather(lat, lon, fetchWeather),
  getForecast: (lat, lon) => getForecast(lat, lon, fetchWeather),
});

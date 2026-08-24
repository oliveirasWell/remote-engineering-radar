import 'server-only';

import type { WeatherProviderService } from '../types';
import { getCurrentWeather } from './getCurrentWeather';
import { getForecast } from './getForecast';
import { searchCities } from './searchCities';

type OpenWeatherDependencies = {
  fetchGeocode?: typeof fetch;
  fetchWeather?: typeof fetch;
};

export const createOpenWeatherProviderService = ({
  fetchGeocode = fetch,
  fetchWeather = fetch,
}: OpenWeatherDependencies = {}): WeatherProviderService => ({
  searchCities: (query) => searchCities(query, fetchGeocode),
  getCurrentWeather: (lat, lon) => getCurrentWeather(lat, lon, fetchWeather),
  getForecast: (lat, lon) => getForecast(lat, lon, fetchWeather),
});

import type { CityMatch, CurrentWeather } from './types';

export interface WeatherProvider {
  searchCities(query: string): Promise<CityMatch[]>;
  getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather>;
}

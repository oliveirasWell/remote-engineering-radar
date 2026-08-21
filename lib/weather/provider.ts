import type { CityMatch, CurrentWeather, ForecastDay } from './types';

export interface WeatherProvider {
  searchCities(query: string): Promise<CityMatch[]>;
  getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather>;
  getForecast(lat: number, lon: number): Promise<ForecastDay[]>;
}

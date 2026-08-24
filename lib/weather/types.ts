export type { TemperatureUnit } from './temperature/constants';

export type CityMatch = {
  id: string;
  name: string;
  state?: string;
  country: string;
  lat: number;
  lon: number;
};

export type CurrentWeather = {
  city: string;
  temp: number;
  condition: string;
  iconCode: number;
  isDay: boolean;
};

export type ForecastDay = {
  date: string;
  label: string;
  low: number;
  high: number;
  iconCode: number;
  isPartial: boolean;
};

export interface WeatherProviderService {
  searchCities(query: string): Promise<CityMatch[]>;
  getCurrentWeather(lat: number, lon: number): Promise<CurrentWeather>;
  getForecast(lat: number, lon: number): Promise<ForecastDay[]>;
}

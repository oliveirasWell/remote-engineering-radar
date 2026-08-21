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

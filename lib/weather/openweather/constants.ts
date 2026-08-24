export const OPENWEATHER_ENDPOINTS = {
  currentWeather: 'https://api.openweathermap.org/data/2.5/weather',
  forecast: 'https://api.openweathermap.org/data/2.5/forecast',
  geocode: 'https://api.openweathermap.org/geo/1.0/direct',
} as const;

export const WEATHER_UNITS = 'metric';
export const GEOCODE_LIMIT = 5;
export const GEOCODE_REVALIDATE_SECONDS = 2_592_000;
export const WEATHER_REVALIDATE_SECONDS = 600;

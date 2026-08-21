export const WEATHER_API_PATHS = {
  geocode: '/api/geocode',
  weather: '/api/weather',
  forecast: '/api/forecast',
} as const;

export const WEATHER_API_ERRORS = {
  search: 'Unable to search cities',
  weather: 'Unable to fetch weather',
} as const;

export const CITY_SEARCH_STALE_TIME_MS = 300_000;
export const CURRENT_WEATHER_STALE_TIME_MS = 600_000;
export const FORECAST_STALE_TIME_MS = 600_000;

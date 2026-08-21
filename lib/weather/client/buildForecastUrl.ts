import { WEATHER_API_PATHS } from '../constants';

export const buildForecastUrl = (lat: number, lon: number) => {
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  return `${WEATHER_API_PATHS.forecast}?${params.toString()}`;
};

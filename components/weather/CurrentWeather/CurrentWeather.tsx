import type {
  CurrentWeather as CurrentWeatherData,
  TemperatureUnit,
} from '@/lib/weather/types';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';

type CurrentWeatherProps = {
  weather: CurrentWeatherData;
  unit: TemperatureUnit;
};

export const CurrentWeather = ({ weather, unit }: CurrentWeatherProps) => (
  <section>
    <h2>{weather.city}</h2>
    <p>{weather.condition}</p>
    <p>{formatTemperature(weather.temp, unit)}</p>
  </section>
);

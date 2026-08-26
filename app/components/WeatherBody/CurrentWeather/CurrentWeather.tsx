import type {
  CurrentWeather as CurrentWeatherData,
  TemperatureUnit,
} from '@/lib/weather/types';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { WeatherIcon } from '../WeatherIcon/WeatherIcon';

type CurrentWeatherProps = {
  weather: CurrentWeatherData;
  unit: TemperatureUnit;
};

export const CurrentWeather = ({ weather, unit }: CurrentWeatherProps) => (
  <section
    className="grid min-h-72 content-center justify-items-center text-center"
    data-weather-section="current"
  >
    <WeatherIcon
      className="my-4 text-9xl"
      iconCode={weather.iconCode}
      isDay={weather.isDay}
    />
    <h2 className="m-0 text-6xl font-light text-shadow-sm">{weather.city}</h2>
    <p className="m-0 text-8xl font-extralight text-shadow-sm">
      {formatTemperature(weather.temp, unit)}
    </p>
  </section>
);

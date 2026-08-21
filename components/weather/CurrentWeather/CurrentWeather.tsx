import type {
  CurrentWeather as CurrentWeatherData,
  TemperatureUnit,
} from '@/lib/weather/types';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { WeatherIcon } from '../WeatherIcon/WeatherIcon';
import styles from './CurrentWeather.module.css';

type CurrentWeatherProps = {
  weather: CurrentWeatherData;
  unit: TemperatureUnit;
};

export const CurrentWeather = ({ weather, unit }: CurrentWeatherProps) => (
  <section className={styles.section} data-weather-section="current">
    <h2 className={styles.city}>{weather.city}</h2>
    <WeatherIcon
      className={styles.icon}
      iconCode={weather.iconCode}
      isDay={weather.isDay}
    />
    <p className={styles.condition}>{weather.condition}</p>
    <p className={styles.temperature}>
      {formatTemperature(weather.temp, unit)}
    </p>
  </section>
);

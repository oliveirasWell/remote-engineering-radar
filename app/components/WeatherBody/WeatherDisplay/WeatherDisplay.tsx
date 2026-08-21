import type {
  CurrentWeather as CurrentWeatherData,
  ForecastDay,
  TemperatureUnit,
} from '@/lib/weather/types';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CurrentWeather } from '../CurrentWeather/CurrentWeather';
import { ForecastGrid } from '../ForecastGrid/ForecastGrid';
import styles from './WeatherDisplay.module.css';
import { WEATHER_DISPLAY_TEXT } from './constants';

type WeatherDisplayProps = {
  hasSelection: boolean;
  isPending: boolean;
  isError: boolean;
  weather: CurrentWeatherData | undefined;
  forecast: ForecastDay[] | undefined;
  forecastPending: boolean;
  forecastError: boolean;
  unit: TemperatureUnit;
};

export const WeatherDisplay = ({
  hasSelection,
  isPending,
  isError,
  weather,
  forecast,
  forecastPending,
  forecastError,
  unit,
}: WeatherDisplayProps) => {
  if (!hasSelection) {
    return null;
  }

  const currentContent = isPending && !weather ? (
    <Spinner />
  ) : isError && !weather ? (
    <p>{WEATHER_API_ERRORS.weather}</p>
  ) : weather ? (
    <CurrentWeather weather={weather} unit={unit} />
  ) : null;

  const forecastContent = forecastPending ? (
    <Spinner />
  ) : forecastError ? (
    <p>{WEATHER_API_ERRORS.weather}</p>
  ) : forecast ? (
    <>
      <h2 className={styles.heading}>{WEATHER_DISPLAY_TEXT.forecastHeading}</h2>
      <ForecastGrid days={forecast} unit={unit} />
    </>
  ) : null;

  return (
    <>
      {currentContent}
      {forecastContent}
    </>
  );
};

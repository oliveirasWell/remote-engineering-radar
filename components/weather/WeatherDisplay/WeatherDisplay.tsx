import type { ReactNode } from 'react';
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
  let content: ReactNode = null;

  if (hasSelection && (isPending || forecastPending)) {
    content = <Spinner />;
  } else if (hasSelection && (isError || forecastError)) {
    content = <p>{WEATHER_API_ERRORS.weather}</p>;
  } else if (weather) {
    content = (
      <>
        <CurrentWeather weather={weather} unit={unit} />
        {forecast && (
          <>
            <h2 className={styles.heading}>
              {WEATHER_DISPLAY_TEXT.forecastHeading}
            </h2>
            <ForecastGrid days={forecast} unit={unit} />
          </>
        )}
      </>
    );
  }

  return content;
};

import type { ReactNode } from 'react';
import type {
  CurrentWeather as CurrentWeatherData,
  TemperatureUnit,
} from '@/lib/weather/types';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { CurrentWeather } from '../CurrentWeather/CurrentWeather';

type WeatherDisplayProps = {
  hasSelection: boolean;
  isPending: boolean;
  isError: boolean;
  weather: CurrentWeatherData | undefined;
  unit: TemperatureUnit;
};

export const WeatherDisplay = ({
  hasSelection,
  isPending,
  isError,
  weather,
  unit,
}: WeatherDisplayProps) => {
  let content: ReactNode = null;

  if (hasSelection && isPending) {
    content = <Spinner />;
  } else if (hasSelection && isError) {
    content = <p>{WEATHER_API_ERRORS.weather}</p>;
  } else if (weather) {
    content = <CurrentWeather weather={weather} unit={unit} />;
  }

  return content;
};

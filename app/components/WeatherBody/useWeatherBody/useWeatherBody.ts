'use client';

import { useState } from 'react';
import type { CityMatch, TemperatureUnit } from '@/lib/weather/types';
import { useCurrentWeather } from '../useCurrentWeather/useCurrentWeather';
import { useForecast } from '../useForecast/useForecast';

const DEFAULT_TEMPERATURE_UNIT: TemperatureUnit = 'fahrenheit';

export const useWeatherBody = (city: CityMatch | null) => {
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    DEFAULT_TEMPERATURE_UNIT,
  );
  const currentWeatherQuery = useCurrentWeather(city);
  const forecastQuery = useForecast(city);

  return {
    temperatureUnit,
    setTemperatureUnit,
    currentWeatherQuery,
    forecastQuery,
  };
};

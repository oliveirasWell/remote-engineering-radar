'use client';

import { useState } from 'react';
import type { CityMatch, TemperatureUnit } from '@/lib/weather/types';
import { useCurrentWeather } from '../useCurrentWeather/useCurrentWeather';

const DEFAULT_TEMPERATURE_UNIT: TemperatureUnit = 'fahrenheit';

export const useWeatherSearch = () => {
  const [query, setQuery] = useState('');
  const [selectedCity, selectCity] = useState<CityMatch | null>(null);
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(
    DEFAULT_TEMPERATURE_UNIT,
  );
  const currentWeatherQuery = useCurrentWeather(selectedCity);

  return {
    query,
    selectedCity,
    setQuery,
    selectCity,
    temperatureUnit,
    setTemperatureUnit,
    currentWeatherQuery,
  };
};

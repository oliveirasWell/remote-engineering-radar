'use client';

import { useState } from 'react';
import type { CityMatch } from '@/lib/weather/types';

export const useWeatherSearch = () => {
  const [query, setQuery] = useState('');
  const [selectedCity, selectCity] = useState<CityMatch | null>(null);
  const selectCityAndClearQuery = (city: CityMatch) => {
    setQuery('');
    selectCity(city);
  };

  return {
    query,
    selectedCity,
    setQuery,
    selectCity: selectCityAndClearQuery,
  };
};

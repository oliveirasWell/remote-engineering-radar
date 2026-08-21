'use client';

import { useQuery } from '@tanstack/react-query';
import type { CityMatch, CurrentWeather } from '@/lib/weather/types';
import { CURRENT_WEATHER_STALE_TIME_MS } from '@/lib/weather/constants';
import { fetchCurrentWeather } from '@/lib/weather/client';

export const useCurrentWeather = (city: CityMatch | null) =>
  useQuery<CurrentWeather>({
    queryKey: ['current-weather', city?.id],
    queryFn: () => fetchCurrentWeather(city!.lat, city!.lon),
    enabled: city !== null,
    staleTime: CURRENT_WEATHER_STALE_TIME_MS,
  });

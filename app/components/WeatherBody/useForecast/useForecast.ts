'use client';

import { useQuery } from '@tanstack/react-query';
import type { CityMatch, ForecastDay } from '@/lib/weather/types';
import { FORECAST_STALE_TIME_MS } from '@/lib/weather/constants';
import { fetchForecast } from '@/lib/weather/client';

export const useForecast = (city: CityMatch | null) =>
  useQuery<ForecastDay[]>({
    queryKey: ['forecast', city?.id],
    queryFn: () => fetchForecast(city!.lat, city!.lon),
    enabled: city !== null,
    staleTime: FORECAST_STALE_TIME_MS,
  });

'use client';

import { useQuery } from '@tanstack/react-query';
import type { CityMatch } from '@/lib/weather/types';
import { isSearchQueryValid, normalizeSearchQuery } from '@/lib/searchQuery';
import { CITY_SEARCH_STALE_TIME_MS } from '@/lib/weather/constants';
import { fetchCityMatches } from '@/lib/weather/client';
import { useDebouncedQuery } from './useDebouncedQuery';

export const useCitySearch = (query: string) => {
  const normalizedQuery = normalizeSearchQuery(query);
  const debouncedQuery = useDebouncedQuery(normalizedQuery);

  return useQuery<CityMatch[]>({
    queryKey: ['cities', debouncedQuery],
    queryFn: () => fetchCityMatches(debouncedQuery),
    enabled: isSearchQueryValid(debouncedQuery),
    retry: false,
    staleTime: CITY_SEARCH_STALE_TIME_MS,
  });
};

'use client';

import type { CityMatch } from '@/lib/weather/types';
import { isSearchQueryValid } from '@/lib/searchQuery';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { CityResults } from '../CityResults/CityResults';
import { Spinner } from '@/components/ui/Spinner/Spinner';
import { useCitySearch } from '../hooks/useCitySearch/useCitySearch';

type SearchResultsProps = {
  query: string;
  onSelect: (city: CityMatch) => void;
};

export const SearchResults = ({ query, onSelect }: SearchResultsProps) => {
  const hasValidQuery = isSearchQueryValid(query);
  const search = useCitySearch(query);

  if (search.isPending && hasValidQuery) {
    return <Spinner />;
  }

  if (search.isError) {
    return <p>{WEATHER_API_ERRORS.search}</p>;
  }

  return (
    <CityResults
      cities={search.data ?? []}
      hasSearched={hasValidQuery}
      onSelect={onSelect}
    />
  );
};

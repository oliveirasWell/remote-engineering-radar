import { normalizeSearchQuery } from './normalizeSearchQuery';

const MIN_SEARCH_QUERY_LENGTH = 2;

export const isSearchQueryValid = (query: string) =>
  normalizeSearchQuery(query).length >= MIN_SEARCH_QUERY_LENGTH;

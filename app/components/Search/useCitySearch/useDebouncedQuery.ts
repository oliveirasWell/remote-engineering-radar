'use client';

import { useEffect, useState } from 'react';

const SEARCH_DEBOUNCE_MS = 300;

export const useDebouncedQuery = (query: string) => {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(query);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [query]);

  return debouncedQuery;
};

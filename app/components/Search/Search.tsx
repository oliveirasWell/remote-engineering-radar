'use client';

import type { CityMatch } from '@/lib/weather/types';
import { Input } from '@/components/ui/Input/Input';
import { Disclaimer } from '@/components/Disclaimer/Disclaimer';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer/constants';
import { SearchResults } from './SearchResults/SearchResults';
import { SEARCH_TEXT } from './constants';

type SearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (city: CityMatch) => void;
};

export const Search = ({ query, onQueryChange, onSelect }: SearchProps) => (
  <aside className="flex min-w-0 flex-col bg-sidebar px-3 pt-6 pb-3">
    <section>
      <h2 className="mb-6 text-3xl font-bold">{SEARCH_TEXT.heading}</h2>
      <Input
        type="search"
        placeholder={SEARCH_TEXT.placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </section>
    <SearchResults query={query} onSelect={onSelect} />
    <Disclaimer className="mt-auto">{DISCLAIMER_TEXT.sidebar}</Disclaimer>
  </aside>
);

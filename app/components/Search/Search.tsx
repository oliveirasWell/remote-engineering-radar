'use client';

import type { CityMatch } from '@/lib/weather/types';
import { Input } from '@/components/ui/Input/Input';
import { Disclaimer } from '@/components/Disclaimer/Disclaimer';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer/constants';
import { SearchResults } from './SearchResults/SearchResults';
import { SEARCH_TEXT } from './constants';
import styles from './Search.module.css';

type SearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  onSelect: (city: CityMatch) => void;
};

export const Search = ({ query, onQueryChange, onSelect }: SearchProps) => (
  <aside className={styles.sidebar}>
    <section className={styles.section}>
      <h2>{SEARCH_TEXT.heading}</h2>
      <Input
        className={styles.input}
        type="search"
        placeholder={SEARCH_TEXT.placeholder}
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
      />
    </section>
    <SearchResults query={query} onSelect={onSelect} />
    <Disclaimer>{DISCLAIMER_TEXT.sidebar}</Disclaimer>
  </aside>
);

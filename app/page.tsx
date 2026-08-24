'use client';

import styles from './page.module.css';
import { Search } from './components/Search/Search';
import { WeatherBody } from './components/WeatherBody/WeatherBody';
import { useWeatherSearch } from './useWeatherSearch/useWeatherSearch';

const Home = () => {
  const { query, selectedCity, setQuery, selectCity } = useWeatherSearch();

  return (
    <main className={styles.page}>
      <Search query={query} onQueryChange={setQuery} onSelect={selectCity} />
      <WeatherBody city={selectedCity} />
    </main>
  );
};

export default Home;

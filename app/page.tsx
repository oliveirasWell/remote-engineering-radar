'use client';

import { Search } from './components/Search/Search';
import { WeatherBody } from './components/WeatherBody/WeatherBody';
import { useWeatherSearch } from './useWeatherSearch/useWeatherSearch';

const Home = () => {
  const { query, selectedCity, setQuery, selectCity } = useWeatherSearch();

  return (
    <main className="grid min-h-dvh grid-cols-1 text-foreground lg:grid-cols-[20rem_minmax(0,1fr)]">
      <Search query={query} onQueryChange={setQuery} onSelect={selectCity} />
      <WeatherBody city={selectedCity} />
    </main>
  );
};

export default Home;

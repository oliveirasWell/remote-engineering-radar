'use client';

import { SearchPanel } from '@/components/weather/SearchPanel/SearchPanel';
import { SearchResults } from '@/components/weather/SearchResults/SearchResults';
import { WeatherDisplay } from '@/components/weather/WeatherDisplay/WeatherDisplay';
import { TemperatureUnitToggle } from '@/components/weather/TemperatureUnitToggle/TemperatureUnitToggle';
import { useWeatherSearch } from '@/components/weather/hooks/useWeatherSearch/useWeatherSearch';

const Home = () => {
  const {
    query,
    selectedCity,
    setQuery,
    selectCity,
    temperatureUnit,
    setTemperatureUnit,
    currentWeatherQuery,
    forecastQuery,
  } = useWeatherSearch();

  return (
    <main>
      <SearchPanel value={query} onQueryChange={setQuery} />
      <SearchResults query={query} onSelect={selectCity} />
      <TemperatureUnitToggle
        unit={temperatureUnit}
        onChange={setTemperatureUnit}
      />
      <WeatherDisplay
        hasSelection={selectedCity !== null}
        isPending={currentWeatherQuery.isPending}
        isError={currentWeatherQuery.isError}
        weather={currentWeatherQuery.data}
        forecast={forecastQuery.data}
        forecastPending={forecastQuery.isPending}
        forecastError={forecastQuery.isError}
        unit={temperatureUnit}
      />
    </main>
  );
};

export default Home;

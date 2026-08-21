'use client';

import styles from './page.module.css';
import { APP_TEXT } from './constants';
import { SearchPanel } from '@/components/weather/SearchPanel/SearchPanel';
import { SearchResults } from '@/components/weather/SearchResults/SearchResults';
import { WeatherDisplay } from '@/components/weather/WeatherDisplay/WeatherDisplay';
import { TemperatureUnitToggle } from '@/components/weather/TemperatureUnitToggle/TemperatureUnitToggle';
import { useWeatherSearch } from '@/components/weather/hooks/useWeatherSearch/useWeatherSearch';
import { Disclaimer } from '@/components/weather/Disclaimer/Disclaimer';
import { DISCLAIMER_TEXT } from '@/components/weather/Disclaimer/constants';

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
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <SearchPanel value={query} onQueryChange={setQuery} />
        <SearchResults query={query} onSelect={selectCity} />
        <Disclaimer>{DISCLAIMER_TEXT.sidebar}</Disclaimer>
      </aside>
      <section className={styles.panel}>
        <h1>{APP_TEXT.weatherHeading}</h1>
        <TemperatureUnitToggle
          unit={temperatureUnit}
          onChange={setTemperatureUnit}
        />
        <div className={styles.weatherDisplay}>
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
        </div>
        <Disclaimer>{DISCLAIMER_TEXT.panel}</Disclaimer>
      </section>
    </main>
  );
};

export default Home;

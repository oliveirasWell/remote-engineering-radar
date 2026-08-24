'use client';

import type { CityMatch } from '@/lib/weather/types';
import { Disclaimer } from '@/components/Disclaimer/Disclaimer';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer/constants';
import { TemperatureUnitToggle } from './TemperatureUnitToggle/TemperatureUnitToggle';
import { WeatherDisplay } from './WeatherDisplay/WeatherDisplay';
import { useWeatherBody } from './useWeatherBody/useWeatherBody';
import { WEATHER_BODY_TEXT } from './constants';
import styles from './WeatherBody.module.css';

type WeatherBodyProps = {
  city: CityMatch | null;
};

export const WeatherBody = ({ city }: WeatherBodyProps) => {
  const {
    temperatureUnit,
    setTemperatureUnit,
    currentWeatherQuery,
    forecastQuery,
  } = useWeatherBody(city);

  return (
    <section className={styles.panel}>
      <h1 className={styles.heading}>{WEATHER_BODY_TEXT.heading}</h1>
      <TemperatureUnitToggle
        unit={temperatureUnit}
        onChange={setTemperatureUnit}
      />
      <div className={styles.weatherDisplay}>
        <WeatherDisplay
          hasSelection={city !== null}
          isPending={currentWeatherQuery.isPending}
          isError={currentWeatherQuery.isError}
          weather={currentWeatherQuery.data}
          forecast={forecastQuery.data}
          forecastPending={forecastQuery.isPending}
          forecastError={forecastQuery.isError}
          unit={temperatureUnit}
        />
      </div>
      <Disclaimer>
        <p>{DISCLAIMER_TEXT.panel.advice}</p>
        <p>{DISCLAIMER_TEXT.panel.responsibility}</p>
      </Disclaimer>
    </section>
  );
};

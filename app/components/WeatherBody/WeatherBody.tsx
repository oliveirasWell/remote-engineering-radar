'use client';

import type { CityMatch } from '@/lib/weather/types';
import { Disclaimer } from '@/components/Disclaimer/Disclaimer';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer/constants';
import { TemperatureUnitToggle } from './TemperatureUnitToggle/TemperatureUnitToggle';
import { WeatherDisplay } from './WeatherDisplay/WeatherDisplay';
import { useWeatherBody } from './useWeatherBody/useWeatherBody';
import { WEATHER_BODY_TEXT } from './constants';

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
    <section className="flex min-w-0 flex-col overflow-hidden bg-linear-to-b from-panel-from to-panel-to p-6 text-on-panel lg:min-h-dvh">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl font-bold">{WEATHER_BODY_TEXT.heading}</h1>
        <TemperatureUnitToggle
          unit={temperatureUnit}
          onChange={setTemperatureUnit}
        />
      </div>
      <div className="min-w-0">
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
      <Disclaimer className="mt-auto">
        <p>{DISCLAIMER_TEXT.panel.advice}</p>
        <p>{DISCLAIMER_TEXT.panel.responsibility}</p>
      </Disclaimer>
    </section>
  );
};

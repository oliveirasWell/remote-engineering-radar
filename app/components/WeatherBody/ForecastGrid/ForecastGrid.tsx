import type { ForecastDay, TemperatureUnit } from '@/lib/weather/types';
import { ForecastCard } from '../ForecastCard/ForecastCard';

type ForecastGridProps = {
  days: ForecastDay[];
  unit: TemperatureUnit;
};

export const ForecastGrid = ({ days, unit }: ForecastGridProps) => (
  <section
    className="mt-6 grid w-full min-w-0 grid-cols-2 gap-6 lg:grid-cols-5"
    data-weather-section="forecast"
  >
    {days.map((day) => (
      <ForecastCard key={day.date} day={day} unit={unit} />
    ))}
  </section>
);

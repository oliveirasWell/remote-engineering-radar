import type { ForecastDay, TemperatureUnit } from '@/lib/weather/types';
import { ForecastCard } from '../ForecastCard/ForecastCard';

type ForecastGridProps = {
  days: ForecastDay[];
  unit: TemperatureUnit;
};

export const ForecastGrid = ({ days, unit }: ForecastGridProps) => (
  <section>
    {days.map((day) => (
      <ForecastCard key={day.date} day={day} unit={unit} />
    ))}
  </section>
);

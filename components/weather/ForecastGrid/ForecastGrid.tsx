import type { ForecastDay, TemperatureUnit } from '@/lib/weather/types';
import { ForecastCard } from '../ForecastCard/ForecastCard';
import styles from './ForecastGrid.module.css';

type ForecastGridProps = {
  days: ForecastDay[];
  unit: TemperatureUnit;
};

export const ForecastGrid = ({ days, unit }: ForecastGridProps) => (
  <section className={styles.grid} data-weather-section="forecast">
    {days.map((day) => (
      <ForecastCard key={day.date} day={day} unit={unit} />
    ))}
  </section>
);

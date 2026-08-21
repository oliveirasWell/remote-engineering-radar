import type { ForecastDay, TemperatureUnit } from '@/lib/weather/types';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { FORECAST_CARD_TEXT } from './constants';
import { WeatherIcon } from '../WeatherIcon/WeatherIcon';
import styles from './ForecastCard.module.css';

type ForecastCardProps = {
  day: ForecastDay;
  unit: TemperatureUnit;
};

export const ForecastCard = ({ day, unit }: ForecastCardProps) => (
  <article className={styles.card}>
    <h3 className={styles.label}>{day.label}</h3>
    <WeatherIcon className={styles.icon} iconCode={day.iconCode} />
    <p className={styles.temperature}>
      {FORECAST_CARD_TEXT.lowPrefix} {formatTemperature(day.low, unit)}
    </p>
    <p className={styles.temperature}>
      {FORECAST_CARD_TEXT.highPrefix} {formatTemperature(day.high, unit)}
    </p>
  </article>
);

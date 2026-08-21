import type { ForecastDay, TemperatureUnit } from '@/lib/weather/types';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { FORECAST_CARD_TEXT } from './constants';

type ForecastCardProps = {
  day: ForecastDay;
  unit: TemperatureUnit;
};

export const ForecastCard = ({ day, unit }: ForecastCardProps) => (
  <article>
    <h3>{day.label}</h3>
    <p>{FORECAST_CARD_TEXT.lowPrefix} {formatTemperature(day.low, unit)}</p>
    <p>{FORECAST_CARD_TEXT.highPrefix} {formatTemperature(day.high, unit)}</p>
  </article>
);

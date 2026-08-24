import type { ForecastDay, TemperatureUnit } from '@/lib/weather/types';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { FORECAST_CARD_TEXT } from './constants';
import { WeatherIcon } from '../WeatherIcon/WeatherIcon';

type ForecastCardProps = {
  day: ForecastDay;
  unit: TemperatureUnit;
};

export const ForecastCard = ({ day, unit }: ForecastCardProps) => (
  <article className="flex min-h-64 min-w-0 flex-col justify-between rounded-xl bg-linear-to-b from-white/55 to-black/28 p-6 text-on-panel shadow-md text-shadow-sm">
    <h3 className="m-0 text-center text-xl">{day.label}</h3>
    <WeatherIcon className="self-center text-6xl" iconCode={day.iconCode} />
    <div className="grid grid-cols-2 items-center text-center text-xl font-normal">
      <span>{FORECAST_CARD_TEXT.lowPrefix}</span>
      <span>{FORECAST_CARD_TEXT.highPrefix}</span>
    </div>
    <div className="grid grid-cols-2 items-center text-center text-3xl font-normal">
      <span>{formatTemperature(day.low, unit)}</span>
      <span>{formatTemperature(day.high, unit)}</span>
    </div>
  </article>
);

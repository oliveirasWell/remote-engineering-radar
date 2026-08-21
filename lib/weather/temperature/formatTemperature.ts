import type { TemperatureUnit } from './constants';

const FAHRENHEIT_SCALE = 9 / 5;
const FAHRENHEIT_OFFSET = 32;

export const formatTemperature = (
  celsius: number,
  unit: TemperatureUnit,
): string => {
  const value =
    unit === 'fahrenheit' ? celsius * FAHRENHEIT_SCALE + FAHRENHEIT_OFFSET : celsius;
  return new Intl.NumberFormat(undefined, {
    style: 'unit',
    unit,
    maximumFractionDigits: 0,
  }).format(value);
};

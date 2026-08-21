import type { TemperatureUnit } from './constants';

const FAHRENHEIT_SCALE = 9 / 5;
const FAHRENHEIT_OFFSET = 32;

type TemperatureFormatOptions = {
  includeUnit?: boolean;
};

export const formatTemperature = (
  celsius: number,
  unit: TemperatureUnit,
  options: TemperatureFormatOptions = {},
): string => {
  const value =
    unit === 'fahrenheit' ? celsius * FAHRENHEIT_SCALE + FAHRENHEIT_OFFSET : celsius;
  const formatted = new Intl.NumberFormat(undefined, {
    style: 'unit',
    unit,
    maximumFractionDigits: 0,
  }).format(value);

  if (options.includeUnit === false) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(value) + '°';
  }

  return formatted;
};

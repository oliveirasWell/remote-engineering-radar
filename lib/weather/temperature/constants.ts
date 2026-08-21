export const TEMPERATURE_UNITS = {
  celsius: 'celsius',
  fahrenheit: 'fahrenheit',
} as const;

export type TemperatureUnit =
  (typeof TEMPERATURE_UNITS)[keyof typeof TEMPERATURE_UNITS];

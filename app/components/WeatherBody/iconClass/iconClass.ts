type IconRange = {
  min: number;
  max: number;
  day: string;
  night: string;
  neutral: string;
};

const ICON_RANGES: readonly IconRange[] = [
  { min: 200, max: 299, day: 'wi-day-thunderstorm', night: 'wi-night-alt-thunderstorm', neutral: 'wi-thunderstorm' },
  { min: 300, max: 399, day: 'wi-day-sprinkle', night: 'wi-night-alt-sprinkle', neutral: 'wi-sprinkle' },
  { min: 500, max: 599, day: 'wi-day-rain', night: 'wi-night-alt-rain', neutral: 'wi-rain' },
  { min: 600, max: 699, day: 'wi-day-snow', night: 'wi-night-alt-snow', neutral: 'wi-snow' },
  { min: 700, max: 799, day: 'wi-day-fog', night: 'wi-night-fog', neutral: 'wi-fog' },
  { min: 800, max: 800, day: 'wi-day-sunny', night: 'wi-night-clear', neutral: 'wi-day-sunny' },
  { min: 801, max: 899, day: 'wi-day-cloudy', night: 'wi-night-alt-cloudy', neutral: 'wi-cloudy' },
];

export const iconClass = (iconCode: number, isDay?: boolean) => {
  const range = ICON_RANGES.find(
    ({ min, max }) => iconCode >= min && iconCode <= max,
  );

  if (!range) {
    return 'wi-cloudy';
  }

  return isDay === undefined ? range.neutral : range[isDay ? 'day' : 'night'];
};

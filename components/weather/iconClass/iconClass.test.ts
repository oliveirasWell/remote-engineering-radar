import { iconClass } from './iconClass';

describe('iconClass', () => {
  it.each([
    [800, true, 'wi-day-sunny'],
    [800, false, 'wi-night-clear'],
    [803, true, 'wi-day-cloudy'],
    [803, false, 'wi-night-alt-cloudy'],
    [803, undefined, 'wi-cloudy'],
    [500, undefined, 'wi-rain'],
    [999, false, 'wi-cloudy'],
  ] as const)('maps %s', (code, isDay, expected) => {
    expect(iconClass(code, isDay)).toBe(expected);
  });
});

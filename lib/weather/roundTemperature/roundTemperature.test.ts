import { roundTemperature } from './roundTemperature';

describe('roundTemperature', () => {
  it.each([
    [65.4, 65],
    [65.5, 66],
  ])('rounds %s to %s', (temperature, expected) => {
    expect(roundTemperature(temperature)).toBe(expected);
  });
});

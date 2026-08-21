import current from '../fixtures/current-chicago.json';
import { currentWeatherResponseSchema } from './currentWeatherResponse';

describe('currentWeatherResponseSchema', () => {
  it('parses the current Chicago fixture', () => {
    expect(currentWeatherResponseSchema.parse(current)).toBeDefined();
  });

  it('rejects an empty weather array', () => {
    expect(() =>
      currentWeatherResponseSchema.parse({ ...current, weather: [] }),
    ).toThrow();
  });

  it('rejects a payload missing main.temp', () => {
    expect(() =>
      currentWeatherResponseSchema.parse({
        ...current,
        main: { ...current.main, temp: undefined },
      }),
    ).toThrow();
  });

  it('ignores unknown upstream keys', () => {
    expect(() =>
      currentWeatherResponseSchema.parse({ ...current, future_field: true }),
    ).not.toThrow();
  });
});

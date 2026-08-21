import forecast from '../fixtures/forecast-chicago.json';
import { forecastResponseSchema } from './forecastResponse';

describe('forecastResponseSchema', () => {
  it('parses the frozen forecast fixture', () => {
    const parsed = forecastResponseSchema.parse(forecast);

    expect(parsed.list).toHaveLength(40);
    expect(typeof parsed.city.timezone).toBe('number');
  });

  it('rejects a block missing temp_min', () => {
    const malformed = {
      ...forecast,
      list: [{
        ...forecast.list[0],
        main: { temp_max: forecast.list[0].main.temp_max },
      }],
    };

    expect(() => forecastResponseSchema.parse(malformed)).toThrow();
  });

  it('rejects an empty forecast list', () => {
    expect(() =>
      forecastResponseSchema.parse({ ...forecast, list: [] }),
    ).toThrow();
  });
});

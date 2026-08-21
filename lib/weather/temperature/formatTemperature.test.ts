import { TEMPERATURE_UNITS } from './constants';
import { formatTemperature } from './formatTemperature';

const CELSIUS_VALUE = 20;

describe('formatTemperature', () => {
  it('formats canonical celsius without a unit suffix', () => {
    expect(formatTemperature(CELSIUS_VALUE, TEMPERATURE_UNITS.celsius)).toBe(
      '20°',
    );
  });

  it('converts canonical celsius to fahrenheit', () => {
    expect(formatTemperature(CELSIUS_VALUE, TEMPERATURE_UNITS.fahrenheit)).toBe(
      '68°',
    );
  });
});

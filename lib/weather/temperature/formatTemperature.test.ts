import { TEMPERATURE_UNITS } from './constants';
import { formatTemperature } from './formatTemperature';

const CELSIUS_VALUE = 20;
const CELSIUS_LABEL = '20°C';
const FAHRENHEIT_LABEL = '68°F';

describe('formatTemperature', () => {
  it('formats canonical celsius as celsius', () => {
    expect(formatTemperature(CELSIUS_VALUE, TEMPERATURE_UNITS.celsius)).toBe(
      CELSIUS_LABEL,
    );
  });

  it('converts canonical celsius to fahrenheit', () => {
    expect(formatTemperature(CELSIUS_VALUE, TEMPERATURE_UNITS.fahrenheit)).toBe(
      FAHRENHEIT_LABEL,
    );
  });
});

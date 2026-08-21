// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createCurrentWeather } from '@/test/factories/domain';
import { TEMPERATURE_UNITS } from '@/lib/weather/temperature/constants';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { CurrentWeather } from './CurrentWeather';

const TEMPERATURE = 20;
const CONDITION = 'clear sky';
const UNIT = TEMPERATURE_UNITS.fahrenheit;

const weather = createCurrentWeather({
  temp: TEMPERATURE,
  condition: CONDITION,
});

describe('CurrentWeather', () => {
  it('renders the icon, city and formatted temperature', () => {
    render(<CurrentWeather weather={weather} unit={UNIT} />);

    expect(screen.getByText(weather.city)).toBeInTheDocument();
    expect(
      screen.getByText(
        formatTemperature(weather.temp, UNIT),
      ),
    ).toBeInTheDocument();
  });
});

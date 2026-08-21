// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { TEMPERATURE_UNITS } from '@/lib/weather/temperature/constants';
import { createForecastDays } from '@/test/factories/domain';
import { formatTemperature } from '@/lib/weather/temperature/formatTemperature';
import { FORECAST_CARD_TEXT } from './constants';
import { ForecastCard } from './ForecastCard';

const [day] = createForecastDays(1);

describe('ForecastCard', () => {
  it('renders the day label and low/high temperatures', () => {
    render(<ForecastCard day={day} unit={TEMPERATURE_UNITS.fahrenheit} />);

    expect(screen.getByText(day.label)).toBeInTheDocument();
    expect(screen.getByText(FORECAST_CARD_TEXT.lowPrefix)).toBeInTheDocument();
    expect(screen.getByText(FORECAST_CARD_TEXT.highPrefix)).toBeInTheDocument();
    expect(
      screen.getByText(formatTemperature(day.low, TEMPERATURE_UNITS.fahrenheit)),
    ).toBeInTheDocument();
    expect(
      screen.getByText(formatTemperature(day.high, TEMPERATURE_UNITS.fahrenheit)),
    ).toBeInTheDocument();
  });
});

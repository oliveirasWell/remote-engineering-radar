// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { createCurrentWeather, createForecastDays } from '@/test/factories/domain';
import { TEMPERATURE_UNITS } from '@/lib/weather/temperature/constants';
import { WeatherDisplay } from './WeatherDisplay';

const currentWeather = createCurrentWeather();
const forecast = createForecastDays();
const displayProps = {
  hasSelection: true,
  isPending: false,
  isError: false,
  forecastPending: false,
  forecastError: false,
  unit: TEMPERATURE_UNITS.fahrenheit,
};

describe('WeatherDisplay', () => {
  it('keeps current weather visible when forecast fails', () => {
    render(
      <WeatherDisplay
        {...displayProps}
        weather={currentWeather}
        forecast={undefined}
        forecastError
      />,
    );

    expect(screen.getByText(currentWeather.city)).toBeInTheDocument();
    expect(screen.getByText(/unable to fetch weather/i)).toBeInTheDocument();
  });

  it('keeps the forecast visible when current weather fails', () => {
    render(
      <WeatherDisplay
        {...displayProps}
        weather={undefined}
        forecast={forecast}
        isError
      />,
    );

    expect(screen.getByText(forecast[0].label)).toBeInTheDocument();
    expect(screen.getByText(/unable to fetch weather/i)).toBeInTheDocument();
  });
});

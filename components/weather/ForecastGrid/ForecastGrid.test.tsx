// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { TEMPERATURE_UNITS } from '@/lib/weather/temperature/constants';
import { createForecastDays } from '@/test/factories/domain';
import { ForecastGrid } from './ForecastGrid';

describe('ForecastGrid', () => {
  it('renders exactly the days it receives', () => {
    const days = createForecastDays(5);
    render(<ForecastGrid days={days} unit={TEMPERATURE_UNITS.fahrenheit} />);

    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.getByText(days[0].label)).toBeInTheDocument();
  });

  it('does not pad fewer than five days', () => {
    render(
      <ForecastGrid days={createForecastDays(3)} unit={TEMPERATURE_UNITS.fahrenheit} />,
    );

    expect(screen.getAllByRole('article')).toHaveLength(3);
  });
});

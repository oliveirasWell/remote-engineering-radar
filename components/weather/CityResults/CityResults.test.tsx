// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import type { CityMatch } from '@/lib/weather/types';
import { createCityMatch } from '@/test/factories/domain';
import { NAIROBI } from '@/test/fixtures/nairobi';
import { CITY_RESULTS_TEXT } from './constants';
import { CityResults } from './CityResults';

const cities: CityMatch[] = [
  createCityMatch(),
  createCityMatch({
    ...NAIROBI,
    state: undefined,
  }),
];
const [chicago, nairobi] = cities;
const CHICAGO_LABEL = `${chicago.name}, ${chicago.state}, ${chicago.country}`;
const NAIROBI_LABEL = `${nairobi.name}, ${nairobi.country}`;

describe('CityResults', () => {
  it('renders nothing for an empty list before a search runs', () => {
    const { container } = render(
      <CityResults cities={[]} hasSearched={false} onSelect={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(
      screen.queryByRole('list'),
    ).not.toBeInTheDocument();
  });

  it('renders each city with its name, state and country', () => {
    render(<CityResults cities={cities} hasSearched onSelect={vi.fn()} />);

    expect(
      screen.getByText(CHICAGO_LABEL),
    ).toBeInTheDocument();
    expect(screen.getByText(NAIROBI_LABEL)).toBeInTheDocument();
  });

  it('renders a no-results message only after a search with no matches', () => {
    const { rerender } = render(
      <CityResults cities={[]} hasSearched={false} onSelect={vi.fn()} />,
    );
    expect(
      screen.queryByText(CITY_RESULTS_TEXT.noResults),
    ).not.toBeInTheDocument();

    rerender(<CityResults cities={[]} hasSearched onSelect={vi.fn()} />);
    expect(screen.getByText(CITY_RESULTS_TEXT.noResults)).toBeInTheDocument();
  });

  it('calls onSelect with the clicked city object', () => {
    const onSelect = vi.fn();
    render(<CityResults cities={cities} hasSearched onSelect={onSelect} />);

    fireEvent.click(
      screen.getByRole('button', { name: NAIROBI_LABEL }),
    );

    expect(onSelect).toHaveBeenCalledWith(cities[1]);
  });
});

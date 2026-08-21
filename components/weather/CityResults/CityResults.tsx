import type { CityMatch } from '@/lib/weather/types';
import { CITY_RESULTS_TEXT } from './constants';

type CityResultsProps = {
  cities: CityMatch[];
  hasSearched: boolean;
  onSelect: (city: CityMatch) => void;
};

export const CityResults = ({
  cities,
  hasSearched,
  onSelect,
}: CityResultsProps) => {
  if (cities.length === 0) {
    return hasSearched ? <p>{CITY_RESULTS_TEXT.noResults}</p> : null;
  }

  return (
    <ul>
      {cities.map((city) => {
        const location = [city.name, city.state, city.country]
          .filter(Boolean)
          .join(', ');

        return (
          <li key={city.id}>
            <button type="button" onClick={() => onSelect(city)}>
              {location}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

import type { CityMatch } from '@/lib/weather/types';
import { Button } from '@/components/ui/Button/Button';
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
    return hasSearched ? (
      <p className="mt-6">{CITY_RESULTS_TEXT.noResults}</p>
    ) : null;
  }

  return (
    <ul className="mt-6 grid list-none gap-2 p-0">
      {cities.map((city) => {
        const location = [city.name, city.state, city.country]
          .filter(Boolean)
          .join(', ');

        return (
          <li key={city.id}>
            <Button variant="list" onClick={() => onSelect(city)}>
              {location}
            </Button>
          </li>
        );
      })}
    </ul>
  );
};

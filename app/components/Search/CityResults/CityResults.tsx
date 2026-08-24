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
            <button
              className="w-full cursor-pointer rounded-xl border-0 bg-transparent px-3 py-2.5 text-left hover:bg-black/10"
              type="button"
              onClick={() => onSelect(city)}
            >
              {location}
            </button>
          </li>
        );
      })}
    </ul>
  );
};

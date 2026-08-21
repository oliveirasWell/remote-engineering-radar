// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
import type { CityMatch } from '@/lib/weather/types';
import {
  createCityMatch,
  createCurrentWeather,
  createForecastDays,
} from '@/test/factories/domain';
import { jsonResponse } from '@/test/http';
import { renderWithQueryClient } from '@/test/render/renderWithQueryClient';
import { buildCurrentWeatherUrl } from '@/lib/weather/client/buildCurrentWeatherUrl';
import { buildForecastUrl } from '@/lib/weather/client/buildForecastUrl';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import Home from './page';

const city = createCityMatch();
const currentWeather = createCurrentWeather();
const forecast = createForecastDays();
const SELECT_CITY_LABEL = `Select ${city.name}`;
const NETWORK_FAILURE_MESSAGE = 'network failure';

vi.mock('@/components/weather/SearchPanel/SearchPanel', () => ({
  SearchPanel: () => null,
}));

vi.mock('@/components/weather/SearchResults/SearchResults', () => ({
  SearchResults: ({ onSelect }: { onSelect: (city: CityMatch) => void }) => (
    <button
      type={"button"}
      onClick={() => onSelect(city)}
    >
      {SELECT_CITY_LABEL}
    </button>
  ),
}));

const renderHome = () => renderWithQueryClient(<Home />);

describe('Home weather selection', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not fetch current weather before a city is selected', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderHome();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches current weather using the selected city coordinates', async () => {
    const fetchMock = vi.fn((url: string) =>
      Promise.resolve(
        jsonResponse(
          url === buildForecastUrl(city.lat, city.lon)
            ? forecast
            : currentWeather,
        ),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderHome();
    screen
      .getByRole('button', { name: SELECT_CITY_LABEL })
      .click();

    await waitFor(() =>
      expect(screen.getByText(city.name)).toBeInTheDocument(),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      buildCurrentWeatherUrl(city.lat, city.lon),
    );
  });

  it('shows loading and error states for the current-weather query', async () => {
    let rejectRequest!: (reason: Error) => void;
    const fetchMock = vi.fn().mockReturnValue(
      new Promise<Response>((_, reject) => {
        rejectRequest = reject;
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    renderHome();
    screen
      .getByRole('button', { name: SELECT_CITY_LABEL })
      .click();
    expect(
      await screen.findByRole('status'),
    ).toBeInTheDocument();

    rejectRequest(new Error(NETWORK_FAILURE_MESSAGE));
    expect(
      await screen.findByText(WEATHER_API_ERRORS.weather),
    ).toBeInTheDocument();
  });
});

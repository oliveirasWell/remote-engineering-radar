// @vitest-environment jsdom
import { screen, waitFor } from '@testing-library/react';
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
import { WeatherBody } from './WeatherBody';

const city = createCityMatch();
const currentWeather = createCurrentWeather();
const forecast = createForecastDays();
const NETWORK_FAILURE_MESSAGE = 'network failure';

const jsonForUrl = (url: string) =>
  jsonResponse(
    url === buildForecastUrl(city.lat, city.lon) ? forecast : currentWeather,
  );

describe('WeatherBody', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('does not fetch current weather before a city is selected', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(<WeatherBody city={null} />);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('fetches current weather using the selected city coordinates', async () => {
    const fetchMock = vi.fn((url: string) => Promise.resolve(jsonForUrl(url)));
    vi.stubGlobal('fetch', fetchMock);

    renderWithQueryClient(<WeatherBody city={city} />);

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

    renderWithQueryClient(<WeatherBody city={city} />);
    expect(await screen.findAllByRole('status')).toHaveLength(2);

    rejectRequest(new Error(NETWORK_FAILURE_MESSAGE));
    expect(
      await screen.findAllByText(WEATHER_API_ERRORS.weather),
    ).toHaveLength(2);
  });
});

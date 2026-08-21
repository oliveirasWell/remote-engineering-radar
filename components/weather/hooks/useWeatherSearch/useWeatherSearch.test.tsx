// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { createCityMatch, createCurrentWeather } from '@/test/factories/domain';
import { jsonResponse } from '@/test/http';
import { createQueryWrapper } from '@/test/factories/queryClient';
import { buildCurrentWeatherUrl } from '@/lib/weather/client/buildCurrentWeatherUrl';
import { useWeatherSearch } from './useWeatherSearch';

const city = createCityMatch();
const currentWeather = createCurrentWeather();
const QUERY = city.name;
const EMPTY_QUERY = '';
const DEFAULT_TEMPERATURE_UNIT = 'fahrenheit';
const CELSIUS_TEMPERATURE_UNIT = 'celsius';

describe('useWeatherSearch', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('owns the query and selected-city weather flow', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(currentWeather));
    vi.stubGlobal('fetch', fetchMock);
    const hook = renderHook(useWeatherSearch, { wrapper: createQueryWrapper() });

    expect(hook.result.current.query).toBe(EMPTY_QUERY);
    expect(hook.result.current.selectedCity).toBeNull();
    expect(hook.result.current.temperatureUnit).toBe(DEFAULT_TEMPERATURE_UNIT);
    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      hook.result.current.setQuery(QUERY);
      hook.result.current.selectCity(city);
    });

    expect(hook.result.current.query).toBe(EMPTY_QUERY);
    expect(hook.result.current.selectedCity).toEqual(city);
    await waitFor(() =>
      expect(hook.result.current.currentWeatherQuery.data).toEqual(currentWeather),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      buildCurrentWeatherUrl(city.lat, city.lon),
    );
  });

  it('updates the presentation temperature unit', () => {
    const hook = renderHook(useWeatherSearch, { wrapper: createQueryWrapper() });

    expect(hook.result.current.temperatureUnit).toBe(DEFAULT_TEMPERATURE_UNIT);

    act(() => {
      hook.result.current.setTemperatureUnit(CELSIUS_TEMPERATURE_UNIT);
    });

    expect(hook.result.current.temperatureUnit).toBe(CELSIUS_TEMPERATURE_UNIT);
  });
});

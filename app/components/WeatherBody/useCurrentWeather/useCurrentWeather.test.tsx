// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { buildCurrentWeatherUrl } from '@/lib/weather/client/buildCurrentWeatherUrl';
import { createCityMatch, createCurrentWeather } from '@/test/factories/domain';
import { createQueryWrapper } from '@/test/factories/queryClient';
import { jsonResponse } from '@/test/http';
import { useCurrentWeather } from './useCurrentWeather';

const city = createCityMatch();
const currentWeather = createCurrentWeather();
const fetchMock = vi.fn();

describe('useCurrentWeather', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and returns the current weather for a selected city', async () => {
    fetchMock.mockResolvedValue(jsonResponse(currentWeather));

    const hook = renderHook(() => useCurrentWeather(city), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() =>
      expect(hook.result.current.data).toEqual(currentWeather),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      buildCurrentWeatherUrl(city.lat, city.lon),
    );
  });

  it('does not fetch without a selected city', async () => {
    const hook = renderHook(() => useCurrentWeather(null), {
      wrapper: createQueryWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(hook.result.current.data).toBeUndefined();
  });
});

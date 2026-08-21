// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { buildForecastUrl } from '@/lib/weather/client/buildForecastUrl';
import { createCityMatch, createForecastDays } from '@/test/factories/domain';
import { createQueryWrapper } from '@/test/factories/queryClient';
import { jsonResponse } from '@/test/http';
import { useForecast } from './useForecast';

const city = createCityMatch();
const forecast = createForecastDays();
const fetchMock = vi.fn();

describe('useForecast', () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('fetches forecast days for a selected city', async () => {
    fetchMock.mockResolvedValue(jsonResponse(forecast));
    const hook = renderHook(() => useForecast(city), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(hook.result.current.data).toEqual(forecast));
    expect(fetchMock).toHaveBeenCalledWith(buildForecastUrl(city.lat, city.lon));
  });
});

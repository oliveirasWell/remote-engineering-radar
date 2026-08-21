// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { createCityMatch } from '@/test/factories/domain';
import {
  createQueryWrapper,
  createTestQueryClient,
} from '@/test/factories/queryClient';
import { jsonResponse } from '@/test/http';
import { buildGeocodeUrl } from '@/lib/weather/client/buildGeocodeUrl';
import { useCitySearch } from './useCitySearch';

const city = createCityMatch();
const fetchMock = vi.fn();
const CITY_QUERY = city.name.toLowerCase();
const SHORT_QUERY = CITY_QUERY.slice(0, 1);
const DEBOUNCE_QUERIES = {
  initial: SHORT_QUERY,
  intermediate: CITY_QUERY.slice(0, 2),
  final: CITY_QUERY.slice(0, 3),
} as const;

describe('useCitySearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetches and returns matching cities', async () => {
    fetchMock.mockResolvedValue(jsonResponse([city]));
    const hook = renderHook(() => useCitySearch(CITY_QUERY), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(hook.result.current.data).toEqual([city]));
    expect(fetchMock).toHaveBeenCalledWith(buildGeocodeUrl(CITY_QUERY));
  });

  it('does not fetch inputs shorter than two characters', async () => {
    renderHook(() => useCitySearch(SHORT_QUERY), {
      wrapper: createQueryWrapper(),
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('waits for typing to settle before fetching', async () => {
    vi.useFakeTimers();
    try {
      fetchMock.mockResolvedValue(jsonResponse([city]));
      const queryClient = createTestQueryClient();
      const wrapper = createQueryWrapper(queryClient);
      const hook = renderHook(
        ({ query }: { query: string }) => useCitySearch(query),
        { initialProps: { query: DEBOUNCE_QUERIES.initial }, wrapper },
      );

      await act(async () => {
        hook.rerender({ query: DEBOUNCE_QUERIES.intermediate });
      });
      fetchMock.mockClear();
      await act(async () => {
        hook.rerender({ query: DEBOUNCE_QUERIES.final });
      });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(299);
      });
      expect(fetchMock).not.toHaveBeenCalled();

      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

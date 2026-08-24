// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { createCityMatch } from '@/test/factories/domain';
import { useWeatherSearch } from './useWeatherSearch';

const city = createCityMatch();
const QUERY = city.name;
const EMPTY_QUERY = '';

describe('useWeatherSearch', () => {
  it('owns the query and selected city', () => {
    const hook = renderHook(useWeatherSearch);

    expect(hook.result.current.query).toBe(EMPTY_QUERY);
    expect(hook.result.current.selectedCity).toBeNull();

    act(() => {
      hook.result.current.setQuery(QUERY);
      hook.result.current.selectCity(city);
    });

    expect(hook.result.current.query).toBe(EMPTY_QUERY);
    expect(hook.result.current.selectedCity).toEqual(city);
  });
});

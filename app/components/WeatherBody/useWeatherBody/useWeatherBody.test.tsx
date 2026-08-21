// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { createQueryWrapper } from '@/test/factories/queryClient';
import { useWeatherBody } from './useWeatherBody';

const DEFAULT_TEMPERATURE_UNIT = 'fahrenheit';
const CELSIUS_TEMPERATURE_UNIT = 'celsius';

describe('useWeatherBody', () => {
  it('updates the presentation temperature unit', () => {
    const hook = renderHook(() => useWeatherBody(null), {
      wrapper: createQueryWrapper(),
    });

    expect(hook.result.current.temperatureUnit).toBe(DEFAULT_TEMPERATURE_UNIT);

    act(() => {
      hook.result.current.setTemperatureUnit(CELSIUS_TEMPERATURE_UNIT);
    });

    expect(hook.result.current.temperatureUnit).toBe(CELSIUS_TEMPERATURE_UNIT);
  });
});

import type { ForecastDay } from '@/lib/weather/types';

export const createForecastDays = (count = 5): ForecastDay[] =>
  Array.from({ length: count }, (_, index) => ({
    date: `2026-08-${String(index + 21).padStart(2, '0')}`,
    label: index === 0 ? 'Today' : 'Tuesday',
    low: 18,
    high: 27,
    iconCode: 800,
    isPartial: false,
  }));

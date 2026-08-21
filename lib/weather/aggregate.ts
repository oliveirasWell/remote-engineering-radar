import type { ForecastDay } from './types';
import type { RawForecastBlock } from './schemas/forecastResponse';

const DAYS_PER_FORECAST = 5;
const BLOCKS_PER_FULL_DAY = 8;
const LOCAL_NOON = 12;

export const aggregate = (
  blocks: RawForecastBlock[],
  timezoneOffsetSeconds: number,
): ForecastDay[] => {
  const groups = new Map<string, RawForecastBlock[]>();

  for (const block of blocks) {
    const shifted = new Date((block.dt + timezoneOffsetSeconds) * 1000);
    const date = shifted.toISOString().slice(0, 10);
    const group = groups.get(date) ?? [];
    group.push(block);
    groups.set(date, group);
  }

  return [...groups.entries()].slice(0, DAYS_PER_FORECAST).map(([date, dayBlocks], index) => {
    const noonBlock = dayBlocks.reduce((closest, block) => {
      const closestHour = new Date((closest.dt + timezoneOffsetSeconds) * 1000).getUTCHours();
      const blockHour = new Date((block.dt + timezoneOffsetSeconds) * 1000).getUTCHours();
      return Math.abs(blockHour - LOCAL_NOON) < Math.abs(closestHour - LOCAL_NOON)
        ? block
        : closest;
    });
    const shifted = new Date((dayBlocks[0].dt + timezoneOffsetSeconds) * 1000);

    return {
      date,
      label:
        index === 0
          ? 'Today'
          : new Intl.DateTimeFormat('en-US', {
              weekday: 'long',
              timeZone: 'UTC',
            }).format(shifted),
      low: Math.min(...dayBlocks.map(({ main }) => main.temp_min)),
      high: Math.max(...dayBlocks.map(({ main }) => main.temp_max)),
      iconCode: noonBlock.weather[0].id,
      isPartial: dayBlocks.length < BLOCKS_PER_FULL_DAY,
    };
  });
};

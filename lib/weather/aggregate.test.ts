import forecast from './fixtures/forecast-chicago.json';
import { aggregate } from './aggregate';

type TestBlock = {
  dt: number;
  main: { temp_min: number; temp_max: number };
  weather: [{ id: number }];
};

const block = (
  iso: string,
  iconCode: number,
  low = 10,
  high = 20,
): TestBlock => ({
  dt: Date.parse(iso) / 1000,
  main: { temp_min: low, temp_max: high },
  weather: [{ id: iconCode }],
});

describe('aggregate', () => {
  it('groups the frozen fixture locally and returns five days', () => {
    const result = aggregate(forecast.list, forecast.city.timezone);

    expect(result).toHaveLength(5);
    expect(result[0].label).toBe('Today');
    expect(result.slice(1).map(({ date }) =>
      new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        timeZone: 'UTC',
      }).format(new Date(`${date}T12:00:00Z`)),
    )).toEqual(result.slice(1).map(({ label }) => label));
    expect(result.every(({ date }) => /^\d{4}-\d{2}-\d{2}$/.test(date))).toBe(
      true,
    );
    expect(result[0].low).toBe(
      Math.min(...forecast.list.slice(0, 5).map(({ main }) => main.temp_min)),
    );
    expect(result[0].high).toBe(
      Math.max(...forecast.list.slice(0, 5).map(({ main }) => main.temp_max)),
    );
  });

  it('applies the offset before grouping by date', () => {
    const blocks = [
      block('2026-01-02T00:30:00Z', 800),
      block('2026-01-02T03:30:00Z', 801),
    ];

    expect(aggregate(blocks, -3600)[0].date).toBe('2026-01-01');
  });

  it('chooses the icon nearest local noon', () => {
    const blocks = [
      block('2026-01-02T03:00:00Z', 200),
      block('2026-01-02T12:00:00Z', 800),
      block('2026-01-02T18:00:00Z', 500),
    ];

    expect(aggregate(blocks, 0)[0].iconCode).toBe(800);
  });

  it('uses the earlier block when noon distance ties', () => {
    const blocks = [
      block('2026-01-02T09:00:00Z', 200),
      block('2026-01-02T15:00:00Z', 800),
    ];

    expect(aggregate(blocks, 0)[0].iconCode).toBe(200);
  });

  it('marks partial groups and keeps full groups unmarked', () => {
    const blocks = [
      block('2026-01-02T00:00:00Z', 800),
      block('2026-01-02T03:00:00Z', 800),
      block('2026-01-02T06:00:00Z', 800),
      ...Array.from({ length: 8 }, (_, index) =>
        block(`2026-01-03T${String(index * 3).padStart(2, '0')}:00:00Z`, 800),
      ),
    ];

    const result = aggregate(blocks, 0);
    expect(result[0].isPartial).toBe(true);
    expect(result[1].isPartial).toBe(false);
  });

  it('returns only the first five groups when six are present', () => {
    const blocks = Array.from({ length: 6 }, (_, day) =>
      block(`2026-01-${String(day + 1).padStart(2, '0')}T12:00:00Z`, 800),
    );

    expect(aggregate(blocks, 0)).toHaveLength(5);
  });

  it('supports non-hour timezone offsets', () => {
    const blocks = [block('2026-01-02T18:45:00Z', 800)];

    expect(aggregate(blocks, 19_800)[0].date).toBe('2026-01-03');
  });
});

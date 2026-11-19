import { median } from './median';

describe('median', () => {
  it.each([
    { values: [], expected: undefined },
    { values: [5], expected: 5 },
    { values: [9, 1, 5], expected: 5 },
    { values: [4, 1, 3, 2], expected: 2.5 },
  ])('is $expected for $values', ({ values, expected }) => {
    expect(median(values)).toBe(expected);
  });
});

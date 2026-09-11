export const COUNTRY_JOBS = [
  {
    sourceJobId: 'brazil-only',
    title: 'Senior Frontend Engineer — Brazil only',
    location: 'Brazil only',
    countries: ['brazil'],
  },
  {
    sourceJobId: 'chile-only',
    title: 'Senior Frontend Engineer — Chile only',
    location: 'Chile only',
    countries: ['chile'],
  },
  {
    sourceJobId: 'brazil-and-chile',
    title: 'Senior Fullstack Engineer — Brazil and Chile',
    location: 'Brazil, Chile',
    countries: ['brazil', 'chile'],
  },
];

export const COUNTRY_FILTER_CASES = [
  { country: 'chile', expectedIndexes: [1, 2] },
  { country: 'brazil', expectedIndexes: [0, 2] },
  { country: 'argentina', expectedIndexes: [] },
  { country: undefined, expectedIndexes: [0, 1, 2] },
] as const;

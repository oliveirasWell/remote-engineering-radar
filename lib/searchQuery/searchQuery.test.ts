import {
  isSearchQueryValid,
  normalizeSearchQuery,
} from './index';

const RAW_QUERY = '  Chi  CaGo  ';
const NORMALIZED_QUERY = 'chi cago';
const SHORT_QUERY = ' a ';
const VALID_QUERY = ' ab ';

describe('search query contract', () => {
  it('trims, lowercases and collapses internal whitespace', () => {
    expect(normalizeSearchQuery(RAW_QUERY)).toBe(NORMALIZED_QUERY);
  });

  it('requires at least two normalized characters', () => {
    expect(isSearchQueryValid(SHORT_QUERY)).toBe(false);
    expect(isSearchQueryValid(VALID_QUERY)).toBe(true);
  });
});

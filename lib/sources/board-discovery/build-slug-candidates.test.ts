import { buildSlugCandidates } from './build-slug-candidates';

describe('buildSlugCandidates', () => {
  it('tries the compact name, then a deduplicated form without generic words', () => {
    expect(buildSlugCandidates('Grafana Labs')).toEqual([
      'grafanalabs',
      'grafana',
    ]);
    expect(buildSlugCandidates('Acme Inc.')).toEqual(['acmeinc', 'acme']);
    expect(buildSlugCandidates('Mercor')).toEqual(['mercor']);
  });
});

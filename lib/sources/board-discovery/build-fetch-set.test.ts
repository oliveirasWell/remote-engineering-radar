import { buildFetchSet } from './build-fetch-set';

describe('buildFetchSet', () => {
  it('keeps seeds first, associates verified seeds, ranks new boards and caps the fetch set', () => {
    const verified = [
      {
        ats: 'greenhouse' as const,
        slug: 'new-low',
        companyName: 'Low',
        softwareCount: 1,
      },
      {
        ats: 'greenhouse' as const,
        slug: 'seed',
        companyName: 'Seed Company',
        softwareCount: 2,
      },
      {
        ats: 'ashby' as const,
        slug: 'other-ats',
        companyName: 'Other',
        softwareCount: 100,
      },
      {
        ats: 'greenhouse' as const,
        slug: 'new-high',
        companyName: 'High',
        softwareCount: 5,
      },
    ];

    expect(
      buildFetchSet('greenhouse', ['seed', 'unlinked'], verified, 3),
    ).toEqual([
      { slug: 'seed', companyName: 'Seed Company' },
      { slug: 'unlinked' },
      { slug: 'new-high', companyName: 'High' },
    ]);
    expect(() => buildFetchSet('greenhouse', ['one', 'two'], [], 1)).toThrow(
      /At most 1 boards/,
    );
  });
});

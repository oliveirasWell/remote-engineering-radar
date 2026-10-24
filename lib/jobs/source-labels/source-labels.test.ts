import { ASHBY_SOURCE_NAME } from '@/lib/sources/ashby/constants';
import { FRONTENDBR_SOURCE_NAME } from '@/lib/sources/frontendbr/constants';
import { GETONBRD_SOURCE_NAME } from '@/lib/sources/getonbrd/constants';
import { GREENHOUSE_SOURCE_NAME } from '@/lib/sources/greenhouse/constants';
import { HACKER_NEWS_SOURCE_NAME } from '@/lib/sources/hackernews/constants';
import { HIMALAYAS_SOURCE_NAME } from '@/lib/sources/himalayas/constants';
import { JOBICY_SOURCE_NAME } from '@/lib/sources/jobicy/constants';
import { LEVER_SOURCE_NAME } from '@/lib/sources/lever/constants';
import { QUAVE_SOURCE_NAME } from '@/lib/sources/quave/constants';
import { YCOMBINATOR_SOURCE_NAME } from '@/lib/sources/ycombinator/constants';
import { jobSourceLabel } from './source-labels';

const SOURCE_NAMES = [
  GREENHOUSE_SOURCE_NAME,
  ASHBY_SOURCE_NAME,
  LEVER_SOURCE_NAME,
  GETONBRD_SOURCE_NAME,
  HACKER_NEWS_SOURCE_NAME,
  HIMALAYAS_SOURCE_NAME,
  JOBICY_SOURCE_NAME,
  FRONTENDBR_SOURCE_NAME,
  QUAVE_SOURCE_NAME,
  YCOMBINATOR_SOURCE_NAME,
];

const UNKNOWN_SOURCE = 'custom-board';

describe('jobSourceLabel', () => {
  it('names every ingest source and leaves an unknown slug unchanged', () => {
    for (const source of SOURCE_NAMES) {
      expect(jobSourceLabel(source).length).toBeGreaterThan(0);
    }
    expect(jobSourceLabel(GREENHOUSE_SOURCE_NAME)).toBe('Greenhouse');
    expect(jobSourceLabel(YCOMBINATOR_SOURCE_NAME)).toBe('Y Combinator');
    expect(jobSourceLabel(UNKNOWN_SOURCE)).toBe(UNKNOWN_SOURCE);
  });
});

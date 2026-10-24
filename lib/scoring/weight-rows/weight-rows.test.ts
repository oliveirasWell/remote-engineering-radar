import { SCORE_WEIGHTS } from '../constants';
import { scoreWeightRows } from './weight-rows';

const byPoints = (left: number, right: number) => left - right;

const expectedPoints = [
  ...Object.values(SCORE_WEIGHTS.technologies),
  ...Object.values(SCORE_WEIGHTS.cloudTechnologies),
  ...Object.values(SCORE_WEIGHTS.seniority),
  ...Object.values(SCORE_WEIGHTS.roleFocus),
  SCORE_WEIGHTS.remote,
  ...Object.values(SCORE_WEIGHTS.geography),
  SCORE_WEIGHTS.onsiteOnly,
  SCORE_WEIGHTS.relocationRequired,
  SCORE_WEIGHTS.unrelatedStack,
  SCORE_WEIGHTS.unrelatedRole,
];

describe('scoreWeightRows', () => {
  it('lists each score weight once, with the points from the scoring table', () => {
    const rows = scoreWeightRows();

    expect(new Set(rows.map(({ id }) => id)).size).toBe(rows.length);
    expect(rows.map(({ points }) => points).sort(byPoints)).toEqual(
      [...expectedPoints].sort(byPoints),
    );
    expect(rows.find(({ id }) => id === 'React')?.points).toBe(
      SCORE_WEIGHTS.technologies.React,
    );
  });
});

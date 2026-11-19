import { RECRUITING_ROLE_FOCUS } from '../../constants';
import { classifyJob, shouldPersistClassifiedJob } from '../../classify-job';
import { RECRUITING_LANE_CASES } from './cases';
import { scoreRecruitingLane } from './score-recruiting-lane';

/** Regression floor; the labeled set currently scores 1.0 on both. */
const MIN_PRECISION = 0.95;
const MIN_RECALL = 0.95;

/** On the recruiting chip means stored by the ingest and claimed by the lane. */
const onRecruitingLane = (title: string, description?: string): boolean => {
  const classification = classifyJob({ title, description });
  return (
    shouldPersistClassifiedJob(classification) &&
    classification.roleFocus.includes(RECRUITING_ROLE_FOCUS)
  );
};

describe('recruiting lane eval', () => {
  const report = scoreRecruitingLane(RECRUITING_LANE_CASES, onRecruitingLane);

  it(`keeps precision at or above ${MIN_PRECISION}`, () => {
    expect(
      { precision: report.precision, falsePositives: report.falsePositives },
      'non-recruiting titles placed on the recruiting lane',
    ).toEqual({
      precision: expect.toSatisfy((value: number) => value >= MIN_PRECISION),
      falsePositives: expect.any(Array),
    });
  });

  it(`keeps recall at or above ${MIN_RECALL}`, () => {
    expect(
      { recall: report.recall, falseNegatives: report.falseNegatives },
      'recruiting titles dropped or left off the lane',
    ).toEqual({
      recall: expect.toSatisfy((value: number) => value >= MIN_RECALL),
      falseNegatives: expect.any(Array),
    });
  });
});

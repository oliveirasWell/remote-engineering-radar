import type { RecruitingLaneCase } from './cases';

export type LaneReport = {
  precision: number;
  recall: number;
  falsePositives: string[];
  falseNegatives: string[];
};

/** Precision and recall of a lane predicate over labeled cases. */
export const scoreRecruitingLane = (
  cases: readonly RecruitingLaneCase[],
  predict: (title: string, description?: string) => boolean,
): LaneReport => {
  const results = cases.map((entry) => ({
    ...entry,
    predicted: predict(entry.title, entry.description),
  }));
  const truePositives = results.filter(
    ({ predicted, recruiting }) => predicted && recruiting,
  ).length;
  const falsePositives = results
    .filter(({ predicted, recruiting }) => predicted && !recruiting)
    .map(({ title }) => title);
  const falseNegatives = results
    .filter(({ predicted, recruiting }) => !predicted && recruiting)
    .map(({ title }) => title);
  const ratio = (part: number, whole: number) =>
    whole === 0 ? 0 : part / whole;
  return {
    precision: ratio(truePositives, truePositives + falsePositives.length),
    recall: ratio(truePositives, truePositives + falseNegatives.length),
    falsePositives,
    falseNegatives,
  };
};

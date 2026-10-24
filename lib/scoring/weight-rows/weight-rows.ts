import { SCORE_WEIGHTS } from '../constants';

export const SCORE_WEIGHT_GROUP_IDS = [
  'react',
  'cloud',
  'seniority',
  'role',
  'adjustment',
] as const;

export type ScoreWeightGroupId = (typeof SCORE_WEIGHT_GROUP_IDS)[number];

export type ScoreWeightRow = {
  id: string;
  group: ScoreWeightGroupId;
  points: number;
};

/** Every public score weight, in the order a reader should meet it. */
export const scoreWeightRows = (): ScoreWeightRow[] => [
  ...Object.entries(SCORE_WEIGHTS.technologies).map(([id, points]) => ({
    id,
    group: 'react' as const,
    points,
  })),
  ...Object.entries(SCORE_WEIGHTS.cloudTechnologies).map(([id, points]) => ({
    id,
    group: 'cloud' as const,
    points,
  })),
  ...Object.entries(SCORE_WEIGHTS.seniority).map(([id, points]) => ({
    id,
    group: 'seniority' as const,
    points,
  })),
  ...Object.entries(SCORE_WEIGHTS.roleFocus).map(([id, points]) => ({
    id,
    group: 'role' as const,
    points,
  })),
  { id: 'remote', group: 'adjustment', points: SCORE_WEIGHTS.remote },
  ...Object.entries(SCORE_WEIGHTS.geography).map(([id, points]) => ({
    id,
    group: 'adjustment' as const,
    points,
  })),
  {
    id: 'onsiteOnly',
    group: 'adjustment',
    points: SCORE_WEIGHTS.onsiteOnly,
  },
  {
    id: 'relocationRequired',
    group: 'adjustment',
    points: SCORE_WEIGHTS.relocationRequired,
  },
  {
    id: 'unrelatedStack',
    group: 'adjustment',
    points: SCORE_WEIGHTS.unrelatedStack,
  },
  {
    id: 'unrelatedRole',
    group: 'adjustment',
    points: SCORE_WEIGHTS.unrelatedRole,
  },
];

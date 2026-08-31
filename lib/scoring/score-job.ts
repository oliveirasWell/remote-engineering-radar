import {
  classifyJob,
  type ClassifyJobInput,
} from '../classification/classify-job';
import type { JobClassification } from '../classification/types';
import {
  MAX_NORMALIZED_SCORE,
  MIN_NORMALIZED_SCORE,
  SCORE_WEIGHTS,
} from './constants';
import type { JobScore } from './types';

type ScoreJobInput = ClassifyJobInput & { seniority?: string };

const scoringSeniority = (
  seniority: string | undefined,
): JobClassification['seniority'] => {
  if (
    seniority === 'junior' ||
    seniority === 'mid' ||
    seniority === 'senior' ||
    seniority === 'staff' ||
    seniority === 'principal'
  ) {
    return seniority;
  }
  return undefined;
};

const normalizeScore = (rawScore: number): number =>
  Math.max(MIN_NORMALIZED_SCORE, Math.min(MAX_NORMALIZED_SCORE, rawScore));

const scoreClassification = (classification: JobClassification): JobScore => {
  let rawScore = 0;
  const reasons: string[] = [];

  for (const [name, weight] of Object.entries(SCORE_WEIGHTS.technologies)) {
    if (classification.technologies.includes(name)) {
      rawScore += weight;
      reasons.push(name);
    }
  }

  if (classification.seniority === 'senior') {
    rawScore += SCORE_WEIGHTS.seniority.senior;
    reasons.push('Senior');
  } else if (classification.seniority === 'staff') {
    rawScore += SCORE_WEIGHTS.seniority.staff;
    reasons.push('Staff');
  } else if (classification.seniority === 'mid') {
    rawScore += SCORE_WEIGHTS.seniority.mid;
    reasons.push('Mid-level');
  } else if (classification.seniority === 'junior') {
    rawScore += SCORE_WEIGHTS.seniority.junior;
    reasons.push('Junior');
  }

  if (classification.roleFocus.includes('frontend')) {
    rawScore += SCORE_WEIGHTS.roleFocus.frontend;
    reasons.push('Frontend');
  }
  if (classification.roleFocus.includes('fullstack')) {
    rawScore += SCORE_WEIGHTS.roleFocus.fullstack;
    reasons.push('Fullstack');
  }

  if (classification.remotePolicy === 'remote') {
    rawScore += SCORE_WEIGHTS.remote;
    reasons.push('Remote');
  } else if (classification.remotePolicy === 'onsite') {
    rawScore += SCORE_WEIGHTS.onsiteOnly;
    reasons.push('On-site only');
  }

  if (classification.geography.includes('brazil')) {
    rawScore += SCORE_WEIGHTS.geography.brazil;
    reasons.push('Brazil');
  }
  if (classification.geography.includes('latam')) {
    rawScore += SCORE_WEIGHTS.geography.latam;
    reasons.push('LATAM');
  }
  if (classification.geography.includes('americas')) {
    rawScore += SCORE_WEIGHTS.geography.americas;
    reasons.push('Americas');
  }

  if (classification.requiresRelocation) {
    rawScore += SCORE_WEIGHTS.relocationRequired;
    reasons.push('Relocation required');
  }

  if (classification.isUnrelatedStack) {
    rawScore += SCORE_WEIGHTS.unrelatedStack;
    reasons.push('Unrelated stack');
  }

  if (classification.isUnrelatedRole) {
    rawScore += SCORE_WEIGHTS.unrelatedRole;
    reasons.push('Unrelated role');
  }

  return {
    rawScore,
    score: normalizeScore(rawScore),
    reasons,
  };
};

export const scoreJob = (input: ScoreJobInput): JobScore => {
  const classification = classifyJob(input);
  return scoreClassification({
    ...classification,
    seniority: classification.seniority ?? scoringSeniority(input.seniority),
  });
};

export const scoreClassifiedJob = (
  classification: JobClassification,
  seniorityFallback?: string,
): JobScore =>
  scoreClassification({
    ...classification,
    seniority: classification.seniority ?? scoringSeniority(seniorityFallback),
  });

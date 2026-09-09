import type { JOB_REMOTE_POLICIES, JOB_SENIORITY_LEVELS } from './constants';

export type JobGeography = 'brazil' | 'latam' | 'americas' | 'worldwide';

export type JobSeniority = (typeof JOB_SENIORITY_LEVELS)[number];

export type JobRemotePolicy = (typeof JOB_REMOTE_POLICIES)[number];

export type JobClassification = {
  technologies: string[];
  seniority?: JobSeniority;
  remotePolicy?: JobRemotePolicy;
  geography: JobGeography[];
  roleFocus: Array<'frontend' | 'fullstack' | 'backend' | 'mobile'>;
  isUnrelatedStack: boolean;
  isUnrelatedRole: boolean;
  requiresRelocation: boolean;
};

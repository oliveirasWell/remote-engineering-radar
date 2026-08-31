export type JobGeography = 'brazil' | 'latam' | 'americas' | 'worldwide';

export type JobClassification = {
  technologies: string[];
  seniority?: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
  remotePolicy?: 'remote' | 'hybrid' | 'onsite';
  geography: JobGeography[];
  roleFocus: Array<'frontend' | 'fullstack' | 'backend' | 'mobile'>;
  isUnrelatedStack: boolean;
  isUnrelatedRole: boolean;
  requiresRelocation: boolean;
};

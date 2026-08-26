export type JobClassification = {
  technologies: string[];
  seniority?: 'junior' | 'mid' | 'senior' | 'staff' | 'principal';
  remotePolicy?: 'remote' | 'hybrid' | 'onsite';
  geography: Array<'brazil' | 'latam' | 'americas' | 'worldwide'>;
  roleFocus: Array<'frontend' | 'fullstack' | 'backend' | 'mobile'>;
  isUnrelatedStack: boolean;
  requiresRelocation: boolean;
};

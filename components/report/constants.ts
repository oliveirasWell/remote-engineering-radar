export const JOB_CARD_COPY = {
  hideAction: 'Hide job',
  hideConfirmation: 'Hide this job? You will not see it again in this browser.',
  whyRelevant: 'Why this is relevant:',
  viewOriginal: 'View original job',
  scoreLabel: 'Score',
  postedLabel: 'Posted',
} as const;

export const HIDDEN_JOBS_STORAGE_KEY = 'remote-engineering-radar:hidden-jobs';
export const HIDDEN_JOBS_CHANGE_EVENT = 'hidden-jobs-change';

export const COMPANY_CARD_COPY = {
  hiringSignalLabel: 'Hiring signal',
  signalsLabel: 'Signals:',
  viewCompany: 'View company',
  openRolesSuffix: 'engineering positions currently open',
} as const;

import { EMPTY_REPORT_SALARY } from '@/lib/report/constants';
import type { ReportJobCard } from '@/lib/report/types';

export const SORTING_JOBS: ReportJobCard[] = [
  {
    id: 'older-job',
    title: 'Senior Frontend Engineer',
    companyName: 'Example Company',
    companyId: 'example-company',
    technologies: ['React'],
    location: 'Brazil',
    remotePolicy: 'remote',
    score: 95,
    postedAt: new Date('2026-09-01T12:00:00Z'),
    url: 'https://example.com/jobs/older',
    ...EMPTY_REPORT_SALARY,
  },
  {
    id: 'newer-job',
    title: 'Fullstack Engineer',
    companyName: 'Example Company',
    companyId: 'example-company',
    technologies: ['React'],
    location: 'Brazil',
    remotePolicy: 'remote',
    score: 20,
    postedAt: new Date('2026-09-10T12:00:00Z'),
    url: 'https://example.com/jobs/newer',
    ...EMPTY_REPORT_SALARY,
  },
  {
    id: 'undated-job',
    title: 'Staff Frontend Engineer',
    companyName: 'Example Company',
    companyId: 'example-company',
    technologies: ['React'],
    location: 'Brazil',
    remotePolicy: 'remote',
    score: 100,
    postedAt: null,
    url: 'https://example.com/jobs/undated',
    ...EMPTY_REPORT_SALARY,
  },
  {
    id: 'same-date-job',
    title: 'Senior Mobile Engineer',
    companyName: 'Example Company',
    companyId: 'example-company',
    technologies: ['React Native'],
    location: 'Brazil',
    remotePolicy: 'remote',
    score: 60,
    postedAt: new Date('2026-09-10T12:00:00Z'),
    url: 'https://example.com/jobs/same-date',
    ...EMPTY_REPORT_SALARY,
  },
];

export const NEWEST_JOB_TITLES = [3, 1, 0, 2].map(
  (index) => SORTING_JOBS[index].title,
);
export const RELEVANT_JOB_TITLES = [2, 0, 3, 1].map(
  (index) => SORTING_JOBS[index].title,
);

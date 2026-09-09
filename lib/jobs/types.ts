import type { JobGeography } from '@/lib/classification/types';

export type Job = {
  id: string;
  companyId: string;
  source: string;
  sourceJobId: string;
  title: string;
  url: string;
  location: string | null;
  remotePolicy: string | null;
  description: string | null;
  technologies: string[];
  geographies: JobGeography[];
  countries: string[];
  seniority: string | null;
  score: number;
  postedAt: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Projection used by every list read. Excludes `description`, by far the
 * largest column, which no list view renders.
 */
export type JobCard = Omit<
  Job,
  'description' | 'lastSeenAt' | 'createdAt' | 'updatedAt'
>;

export type NewJob = {
  companyId: string;
  source: string;
  sourceJobId: string;
  title: string;
  url: string;
  location?: string | null;
  remotePolicy?: string | null;
  description?: string | null;
  technologies?: string[];
  geographies?: JobGeography[];
  countries?: string[];
  seniority?: string | null;
  score?: number;
  postedAt?: Date | null;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  isActive?: boolean;
};

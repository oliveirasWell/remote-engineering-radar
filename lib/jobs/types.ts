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
  seniority: string | null;
  score: number;
  postedAt: Date | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

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
  seniority?: string | null;
  score?: number;
  postedAt?: Date | null;
  firstSeenAt?: Date;
  lastSeenAt?: Date;
  isActive?: boolean;
};

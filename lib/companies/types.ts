import type { CompanyKind } from './constants';

export type Company = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  source: string;
  kind: CompanyKind;
  hiringScore: number;
  createdAt: Date;
  updatedAt: Date;
};

export type NewCompany = {
  name: string;
  slug: string;
  websiteUrl?: string | null;
  logoUrl?: string | null;
  source: string;
  kind?: CompanyKind;
  hiringScore?: number;
};

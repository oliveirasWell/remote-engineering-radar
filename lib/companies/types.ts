export type Company = {
  id: string;
  name: string;
  slug: string;
  websiteUrl: string | null;
  logoUrl: string | null;
  source: string;
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
  hiringScore?: number;
};

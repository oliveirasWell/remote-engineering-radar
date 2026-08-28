export type HiringSignal = {
  id: string;
  companyId: string;
  type: string;
  description: string;
  sourceUrl: string | null;
  score: number;
  detectedAt: Date;
  createdAt: Date;
};

export type NewHiringSignal = {
  companyId: string;
  type: string;
  description: string;
  sourceUrl?: string | null;
  score?: number;
  detectedAt?: Date;
};

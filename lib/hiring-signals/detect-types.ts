export type HiringSignalDetection = {
  type: string;
  description: string;
  sourceUrl?: string;
  score: number;
};

export type HiringSignalJobInput = {
  title: string;
  technologies: string[];
  sourceUrl?: string;
  postedAt?: Date | null;
  firstSeenAt?: Date | null;
  isActive?: boolean;
};

export type DetectHiringSignalsResult = {
  signals: HiringSignalDetection[];
  hiringScore: number;
  summary: string;
};

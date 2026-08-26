export type HiringSignalDetection = {
  type: string;
  description: string;
  score: number;
};

export type HiringSignalJobInput = {
  title: string;
  technologies: string[];
  postedAt?: Date | null;
  firstSeenAt?: Date | null;
  isActive?: boolean;
};

export type DetectHiringSignalsResult = {
  signals: HiringSignalDetection[];
  hiringScore: number;
  summary: string;
};

export const TEST_COMPANY = {
  name: 'Acme Robotics',
  slug: 'acme-robotics',
  websiteUrl: 'https://acme.example',
  logoUrl: 'https://acme.example/logo.png',
  source: 'greenhouse',
  hiringScore: 12,
} as const;

export const TEST_JOB = {
  source: 'greenhouse',
  sourceJobId: 'gh-1001',
  title: 'Senior Frontend Engineer',
  url: 'https://boards.greenhouse.io/acme/jobs/1001',
  location: 'Remote - LATAM',
  remotePolicy: 'remote',
  description: 'Build React applications with TypeScript.',
  technologies: ['React', 'TypeScript'],
  seniority: 'senior',
  score: 88,
} as const;

export const TEST_HIRING_SIGNAL = {
  type: 'MULTIPLE_ENGINEERING_OPENINGS',
  description: 'Company currently has 7 engineering positions open.',
  sourceUrl: 'https://boards.greenhouse.io/acme',
  score: 25,
} as const;

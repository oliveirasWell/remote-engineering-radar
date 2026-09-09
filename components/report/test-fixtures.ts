import { COMPANY_KINDS } from '@/lib/companies/constants';
import type { ReportCompanyCard, ReportJobDetail } from '@/lib/report/types';

export const TEST_REPORT_COMPANY: ReportCompanyCard = {
  id: 'company-1',
  name: 'Acme Robotics',
  slug: 'acme-robotics',
  hiringScore: 55,
  kind: COMPANY_KINDS.product,
  summary: 'Strong hiring signal',
  signalDescriptions: [
    'Company currently has 7 engineering positions open.',
    '3 open roles involve React/TypeScript/Node hiring.',
  ],
  websiteUrl: 'https://acme.example',
  openEngineeringJobs: 7,
};

export const TEST_REPORT_JOB = {
  id: 'job-1',
  title: 'Senior Frontend Engineer',
  companyName: 'Acme Robotics',
  companyId: 'company-1',
  technologies: ['React', 'TypeScript', 'GraphQL'],
  location: 'LATAM',
  remotePolicy: 'remote',
  score: 94,
  postedAt: new Date('2026-08-26T06:00:00Z'),
  url: 'https://example.com/jobs/1',
  reasons: ['Matches the focus stack'],
} satisfies ReportJobDetail;

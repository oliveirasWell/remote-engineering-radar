import { COMPANY_KINDS } from '@/lib/companies/constants';
import type { ReportCompanyCard } from '@/lib/report/types';

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

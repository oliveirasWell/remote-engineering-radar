// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { CompanyCard } from './CompanyCard';
import { COMPANY_CARD_COPY } from '../constants';

const company = {
  id: 'company-1',
  name: 'Acme Robotics',
  slug: 'acme-robotics',
  hiringScore: 55,
  summary: 'Strong hiring signal',
  signalDescriptions: [
    'Company currently has 7 engineering positions open.',
    '3 open roles involve React/TypeScript/Node hiring.',
  ],
  websiteUrl: 'https://acme.example',
  openEngineeringJobs: 7,
};

describe('CompanyCard', () => {
  it('renders hiring signal summary and evidence', () => {
    render(<CompanyCard company={company} />);

    expect(
      screen.getByRole('heading', { name: company.name }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        `${COMPANY_CARD_COPY.hiringSignalLabel}: ${company.summary}`,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(company.signalDescriptions[0]!),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: COMPANY_CARD_COPY.viewCompany }),
    ).toHaveAttribute('href', company.websiteUrl);
  });
});

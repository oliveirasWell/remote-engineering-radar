// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { CompanyCard } from './CompanyCard';
import { COMPANY_CARD_COPY } from '../constants';
import { TEST_REPORT_COMPANY } from '../test-fixtures';

const company = TEST_REPORT_COMPANY;

describe('CompanyCard', () => {
  it('renders hiring signal summary and evidence', () => {
    render(<CompanyCard company={company} />);

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

  it('does not render an unsafe company URL', () => {
    render(
      <CompanyCard
        company={{ ...company, websiteUrl: 'javascript:alert(1)' }}
      />,
    );

    expect(
      screen.getByRole('link', { name: COMPANY_CARD_COPY.viewCompany }),
    ).toHaveAttribute('href', '/');
  });
});

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { CompanyCard } from './CompanyCard';
import { COMPANY_CARD_COPY } from '../constants';
import { TEST_REPORT_COMPANY } from '../test-fixtures';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';

const company = TEST_REPORT_COMPANY;
const GENERATED_SUMMARIES = [
  { source: 'Strong hiring signal', translated: 'Forte sinal de contratação' },
  {
    source: 'Company is actively expanding engineering hiring.',
    translated: 'A empresa está ampliando as contratações de engenharia.',
  },
];
const UNKNOWN_SUMMARY = 'Source-provided hiring overview';

describe('CompanyCard', () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
  });

  it.each(GENERATED_SUMMARIES)(
    'translates the generated summary: $source',
    ({ source, translated }) => {
      const { companyCard } = messagesFor('pt-BR');
      document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
      render(
        <I18nProvider>
          <CompanyCard company={{ ...company, summary: source }} />
        </I18nProvider>,
      );
      expect(
        screen.getByText(`${companyCard.hiringSignalLabel}: ${translated}`),
      ).toBeInTheDocument();
    },
  );

  it('translates labels but leaves unknown summaries and persisted evidence untouched', () => {
    const { companyCard } = messagesFor('pt-BR');
    document.cookie = `${LOCALE_COOKIE}=pt-BR; path=/`;
    render(
      <I18nProvider>
        <CompanyCard company={{ ...company, summary: UNKNOWN_SUMMARY }} />
      </I18nProvider>,
    );
    expect(
      screen.getByText(`${companyCard.hiringSignalLabel}: ${UNKNOWN_SUMMARY}`),
    ).toBeInTheDocument();
    expect(screen.getByText(companyCard.signalsLabel)).toBeInTheDocument();
    for (const description of company.signalDescriptions) {
      expect(screen.getByText(description)).toBeInTheDocument();
    }
    expect(
      screen.getByRole('link', { name: companyCard.viewCompany }),
    ).toHaveAttribute('href', company.websiteUrl);
  });

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

// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { HOME_SECTIONS } from '@/app/home-constants';
import { COMPANY_KINDS } from '@/lib/companies/constants';
import { CompanySummary } from './CompanySummary';
import { COMPANY_CARD_COPY } from '../constants';
import { TEST_REPORT_COMPANY } from '../test-fixtures';
import { I18nProvider } from '@/components/i18n/I18nProvider/I18nProvider';
import { LOCALE_COOKIE, messagesFor } from '@/lib/i18n/messages';

describe('CompanySummary', () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
  });

  it.each([0, 1, 2])(
    'translates the kind and count for %s open roles',
    (count) => {
      const locale = 'pt-BR';
      const { home, companyCard } = messagesFor(locale);
      document.cookie = `${LOCALE_COOKIE}=${locale}; path=/`;
      render(
        <I18nProvider>
          <CompanySummary
            company={{
              ...TEST_REPORT_COMPANY,
              kind: COMPANY_KINDS.consultancy,
              openEngineeringJobs: count,
            }}
          />
        </I18nProvider>,
      );
      expect(
        screen.getByText(companyCard.kindLabels.consultancy),
      ).toBeInTheDocument();
      expect(screen.getByText(home.openRoles(count))).toBeInTheDocument();
      expect(screen.getByText(TEST_REPORT_COMPANY.name)).toBeInTheDocument();
    },
  );

  it('names the company and how many roles are open', () => {
    render(
      <CompanySummary
        company={{ ...TEST_REPORT_COMPANY, openEngineeringJobs: 62 }}
      />,
    );

    expect(screen.getByText(TEST_REPORT_COMPANY.name)).toBeInTheDocument();
    expect(screen.getByText(HOME_SECTIONS.openRoles(62))).toBeInTheDocument();
  });

  it('singularises a lone open role', () => {
    render(
      <CompanySummary
        company={{ ...TEST_REPORT_COMPANY, openEngineeringJobs: 1 }}
      />,
    );

    expect(screen.getByText('1 open role')).toBeInTheDocument();
  });

  it('labels the kind for a consultancy', () => {
    render(
      <CompanySummary
        company={{ ...TEST_REPORT_COMPANY, kind: COMPANY_KINDS.consultancy }}
      />,
    );

    expect(
      screen.getByText(COMPANY_CARD_COPY.kindLabels.consultancy),
    ).toBeInTheDocument();
  });
});

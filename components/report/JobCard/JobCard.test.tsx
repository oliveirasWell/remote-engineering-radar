// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { JobCard } from './JobCard';
import { JOB_CARD_COPY } from '../constants';

const job = {
  id: 'job-1',
  title: 'Senior Frontend Engineer',
  companyName: 'Acme Robotics',
  companyId: 'company-1',
  technologies: ['React', 'TypeScript', 'GraphQL'],
  location: 'LATAM',
  remotePolicy: 'remote',
  score: 94,
  reasons: ['React', 'TypeScript', 'GraphQL', 'Senior', 'Remote'],
  postedAt: new Date('2026-08-26T06:00:00Z'),
  url: 'https://example.com/jobs/1',
};

describe('JobCard', () => {
  it('renders score, reasons, and original job link', () => {
    render(<JobCard job={job} />);

    expect(
      screen.getByRole('heading', { name: job.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(job.companyName)).toBeInTheDocument();
    expect(
      screen.getByText(`${JOB_CARD_COPY.scoreLabel}: ${job.score}`),
    ).toBeInTheDocument();
    expect(screen.getByText(JOB_CARD_COPY.whyRelevant)).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: JOB_CARD_COPY.viewOriginal }),
    ).toHaveAttribute('href', job.url);
  });
});

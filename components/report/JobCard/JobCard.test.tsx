// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { JobCard } from './JobCard';
import { HIDDEN_JOBS_STORAGE_KEY, JOB_CARD_COPY } from '../constants';

const job = {
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
};

describe('JobCard', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders the original job link without exposing the score', () => {
    render(<JobCard job={job} />);

    expect(
      screen.getByRole('heading', { name: job.title }),
    ).toBeInTheDocument();
    expect(screen.getByText(job.companyName)).toBeInTheDocument();
    expect(
      screen.queryByText((content) => content.includes(String(job.score))),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: JOB_CARD_COPY.viewOriginal }),
    ).toHaveAttribute('href', job.url);
  });

  it('does not render an unsafe original job link', () => {
    render(<JobCard job={{ ...job, url: 'javascript:alert(1)' }} />);

    expect(
      screen.queryByRole('link', { name: JOB_CARD_COPY.viewOriginal }),
    ).not.toBeInTheDocument();
  });

  it('hides a job after confirmation and persists the choice', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<JobCard job={job} />);

    fireEvent.click(
      screen.getByRole('button', { name: JOB_CARD_COPY.hideAction }),
    );

    expect(window.confirm).toHaveBeenCalledWith(JOB_CARD_COPY.hideConfirmation);
    expect(
      screen.queryByRole('heading', { name: job.title }),
    ).not.toBeInTheDocument();
    expect(localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY)).toBe(
      JSON.stringify([job.id]),
    );
  });

  it('keeps a job visible when hiding is cancelled', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(<JobCard job={job} />);

    fireEvent.click(
      screen.getByRole('button', { name: JOB_CARD_COPY.hideAction }),
    );

    expect(
      screen.getByRole('heading', { name: job.title }),
    ).toBeInTheDocument();
    expect(localStorage.getItem(HIDDEN_JOBS_STORAGE_KEY)).toBeNull();
  });

  it('does not render a previously hidden job', () => {
    localStorage.setItem(HIDDEN_JOBS_STORAGE_KEY, JSON.stringify([job.id]));

    render(<JobCard job={job} />);

    expect(
      screen.queryByRole('heading', { name: job.title }),
    ).not.toBeInTheDocument();
  });
});

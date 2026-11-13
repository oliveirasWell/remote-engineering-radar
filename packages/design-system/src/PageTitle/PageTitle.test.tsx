// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { PageTitle } from './PageTitle';

const TITLE = 'Remote jobs';

describe('PageTitle', () => {
  it('renders a level-two heading by default', () => {
    render(<PageTitle>{TITLE}</PageTitle>);

    expect(screen.getByRole('heading', { level: 2, name: TITLE })).toHaveClass(
      'text-3xl',
      'font-bold',
    );
  });

  it('renders the requested heading level', () => {
    render(<PageTitle as="h1">{TITLE}</PageTitle>);

    expect(
      screen.getByRole('heading', { level: 1, name: TITLE }),
    ).toBeVisible();
  });

  it('lets a caller class override a conflicting default', () => {
    render(<PageTitle className="text-4xl">{TITLE}</PageTitle>);

    const heading = screen.getByRole('heading', { name: TITLE });
    expect(heading).toHaveClass('text-4xl');
    expect(heading).not.toHaveClass('text-3xl');
  });

  it('adds a text shadow for the panel variant', () => {
    render(<PageTitle shadow="panel">{TITLE}</PageTitle>);

    expect(screen.getByRole('heading', { name: TITLE })).toHaveClass(
      'text-shadow-sm',
    );
  });
});

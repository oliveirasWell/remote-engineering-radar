// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import Home from './page';
import { APP_NAME, UPDATED_PLACEHOLDER } from './constants';

describe('Home', () => {
  it('renders the product brand and update placeholder', () => {
    render(<Home />);

    expect(
      screen.getByRole('heading', { level: 1, name: APP_NAME }),
    ).toBeInTheDocument();
    expect(screen.getByText(UPDATED_PLACEHOLDER)).toBeInTheDocument();
  });
});

// @vitest-environment jsdom
import { screen } from '@testing-library/react';
import { WEATHER_API_ERRORS } from '@/lib/weather/constants';
import { CHICAGO } from '@/test/fixtures/chicago';
import { renderWithQueryClient } from '@/test/render/renderWithQueryClient';
import { SearchResults } from './SearchResults';

const QUERY = CHICAGO.name.toLowerCase();
const NETWORK_FAILURE_MESSAGE = 'network failure';

describe('SearchResults', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders nothing before a valid query', () => {
    renderWithQueryClient(<SearchResults query="" onSelect={vi.fn()} />);

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('renders a spinner while the search is loading', () => {
    vi.stubGlobal('fetch', () => new Promise(() => {}));

    renderWithQueryClient(<SearchResults query={QUERY} onSelect={vi.fn()} />);

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders an error message when the search fails', async () => {
    vi.stubGlobal('fetch', () =>
      Promise.reject(new Error(NETWORK_FAILURE_MESSAGE)),
    );

    renderWithQueryClient(<SearchResults query={QUERY} onSelect={vi.fn()} />);

    expect(
      await screen.findByText(WEATHER_API_ERRORS.search),
    ).toBeInTheDocument();
  });
});

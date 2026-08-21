// @vitest-environment jsdom
import { fireEvent, screen } from '@testing-library/react';
import { CHICAGO } from '@/test/fixtures/chicago';
import { renderWithQueryClient } from '@/test/render/renderWithQueryClient';
import { SEARCH_TEXT } from './constants';
import { Search } from './Search';

const QUERY = CHICAGO.name;
const EMPTY_QUERY = '';

describe('Search', () => {
  it('renders the heading and city search input', () => {
    renderWithQueryClient(
      <Search
        query={EMPTY_QUERY}
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
      />,
    );

    expect(
      screen.getByRole('heading', {
        name: SEARCH_TEXT.heading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(SEARCH_TEXT.placeholder),
    ).toBeInTheDocument();
  });

  it('reports the entered query value', () => {
    const onQueryChange = vi.fn();
    renderWithQueryClient(
      <Search
        query={EMPTY_QUERY}
        onQueryChange={onQueryChange}
        onSelect={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(SEARCH_TEXT.placeholder), {
      target: { value: QUERY },
    });

    expect(onQueryChange).toHaveBeenCalledWith(QUERY);
  });
});

// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { CHICAGO } from '@/test/fixtures/chicago';
import { SEARCH_PANEL_TEXT } from './constants';
import { SearchPanel } from './SearchPanel';

const QUERY = CHICAGO.name;
const EMPTY_QUERY = '';

describe('SearchPanel', () => {
  it('renders the heading and city search input', () => {
    render(<SearchPanel value={EMPTY_QUERY} onQueryChange={vi.fn()} />);

    expect(
      screen.getByRole('heading', {
        name: SEARCH_PANEL_TEXT.heading,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(SEARCH_PANEL_TEXT.placeholder),
    ).toBeInTheDocument();
  });

  it('reports the entered query value', () => {
    const onQueryChange = vi.fn();
    render(<SearchPanel value={EMPTY_QUERY} onQueryChange={onQueryChange} />);

    fireEvent.change(
      screen.getByPlaceholderText(SEARCH_PANEL_TEXT.placeholder),
      { target: { value: QUERY } },
    );

    expect(onQueryChange).toHaveBeenCalledWith(QUERY);
  });
});

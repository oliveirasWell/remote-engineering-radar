// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { EN_MESSAGES } from '@/lib/i18n/messages';
import { SiteWordmark } from './SiteWordmark';

describe('SiteWordmark', () => {
  it('stacks each brand word on its own line behind a single accessible name', () => {
    render(
      <h1>
        <SiteWordmark />
      </h1>,
    );

    const heading = screen.getByRole('heading', {
      name: EN_MESSAGES.app.name,
    });
    const lines = heading.querySelectorAll('[aria-hidden="true"]');

    expect([...lines].map((line) => line.textContent)).toEqual(
      EN_MESSAGES.app.name.split(' '),
    );
  });
});

// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { GA_MEASUREMENT_ID, GA_SCRIPT_ID } from './constants';
import { GoogleAnalytics } from './GoogleAnalytics';

vi.mock('next/script', () => ({
  default: ({
    id,
    src,
    children,
  }: {
    id?: string;
    src?: string;
    children?: React.ReactNode;
  }) => (
    <div data-testid={id ?? src} id={id} data-src={src}>
      {typeof children === 'string' ? children : null}
    </div>
  ),
}));

describe('GoogleAnalytics', () => {
  it('loads gtag scripts with the measurement id constant', () => {
    const { container } = render(<GoogleAnalytics />);

    expect(
      container.querySelector(
        `[data-src="https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}"]`,
      ),
    ).not.toBeNull();
    expect(container.querySelector(`#${GA_SCRIPT_ID}`)?.textContent).toContain(
      GA_MEASUREMENT_ID,
    );
  });
});

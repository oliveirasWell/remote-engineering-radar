// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GA_SCRIPT_ID } from './constants';
import { GoogleAnalytics } from './GoogleAnalytics';

const TEST_MEASUREMENT_ID = 'G-TESTMEASURE1';

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
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('loads gtag scripts when the measurement id is set in production', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', TEST_MEASUREMENT_ID);
    const { container } = render(<GoogleAnalytics />);

    expect(
      container.querySelector(
        `[data-src="https://www.googletagmanager.com/gtag/js?id=${TEST_MEASUREMENT_ID}"]`,
      ),
    ).not.toBeNull();
    expect(container.querySelector(`#${GA_SCRIPT_ID}`)?.textContent).toContain(
      TEST_MEASUREMENT_ID,
    );
  });

  it.each(['', '   ', undefined])(
    'sends no traffic when the measurement id is %s',
    (measurementId) => {
      vi.stubEnv('VERCEL_ENV', 'production');
      vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', measurementId);
      const { container } = render(<GoogleAnalytics />);

      expect(container.innerHTML).toBe('');
    },
  );

  it.each(['preview', 'development', undefined])(
    'sends no traffic to the production property from %s',
    (environment) => {
      vi.stubEnv('VERCEL_ENV', environment);
      vi.stubEnv('NEXT_PUBLIC_GA_MEASUREMENT_ID', TEST_MEASUREMENT_ID);
      const { container } = render(<GoogleAnalytics />);

      expect(container.innerHTML).toBe('');
    },
  );
});

import '@testing-library/jest-dom/vitest';

/**
 * `cacheLife` only exists inside a Next build with `cacheComponents` enabled.
 * `next build` verifies the real behaviour; here it is inert configuration so
 * the cached data functions stay callable under Vitest.
 */
vi.mock('next/cache', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/cache')>()),
  cacheLife: () => undefined,
  cacheTag: () => undefined,
}));
